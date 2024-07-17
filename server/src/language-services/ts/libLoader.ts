/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { join, resolve, sep } from 'path';
import { readFileSync, existsSync, readdirSync, lstatSync } from 'fs';
import { GenericServer } from '../../GenericServer';
import { pathToUri } from '../../tools';
import { version } from 'typescript';

const contents: { [name: string]: string } = {};




const serverFolder = () => GenericServer.extensionPath;
export const TYPESCRIPT_LIB_SOURCE = () => join(serverFolder(), 'node_modules/typescript/lib');
export const AVENTUS_DEF_BASE_PATH = () => join(serverFolder(), 'lib/Aventus@Main.package.avt');
export const AVENTUS_DEF_UI_PATH = () => join(serverFolder(), 'lib/Aventus@UI.package.avt');
export const AVENTUS_DEF_SHARP_PATH = () => join(serverFolder(), 'lib/Aventus@Sharp.package.avt');
const NODE_MODULES = () => join(serverFolder(), 'node_modules');

const libsTypescript: string[] = [];

export function loadTypescriptLib() {
	if (libsTypescript.length > 0) {
		return;
	}
	let files = readdirSync(TYPESCRIPT_LIB_SOURCE());
	for (let file of files) {
		if (file.endsWith(".d.ts")) {
			libsTypescript.push(file);
		}
	}
}

export function loadNodeModules(nodeModulesPath: string): string[] {
	if (!existsSync(nodeModulesPath)) return [];

	const folders = readdirSync(nodeModulesPath)
	const result: string[] = [];
	const getPackageExports = (modulePath: string) => {
		const packageJsonPath = join(modulePath, 'package.json');
		if (!existsSync(packageJsonPath)) {
			return
		}
		const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

		const exports: string[] = [];
		let hasTs = false;

		const addExportPath = (exportPath: string) => {
			try {
				const fullPath = resolve(modulePath, exportPath);
				if (existsSync(fullPath) && !exports.includes(fullPath)) {
					exports.push(fullPath);
				}
				if (exportPath.endsWith(".ts")) {
					hasTs = true;
				}
			} catch (e) {
				console.error(e)
			}
		};

		if (packageJson.main) {
			addExportPath(packageJson.main);
		}

		if (packageJson.module) {
			addExportPath(packageJson.module);
		}

		if (packageJson.types) {
			addExportPath(packageJson.types);
		}

		if (packageJson.typings) {
			addExportPath(packageJson.typings);
		}

		if (packageJson.exports) {
			const evaluateCondition = (condition: string, version: string): boolean => {
				// This function should evaluate the condition based on the version
				// For simplicity, we assume version is '5.0' and condition is of form '<=5.0'
				if (condition.startsWith('<=')) {
					return version <= condition.substring(2);
				}
				if (condition.startsWith('<')) {
					return version < condition.substring(1);
				}
				if (condition.startsWith('>=')) {
					return version >= condition.substring(2);
				}
				if (condition.startsWith('>')) {
					return version > condition.substring(1);
				}
				if (condition === version) {
					return true;
				}
				return false;
			};
			const loop = (exportPath: any) => {
				if (!exportPath) return;

				if (typeof exportPath === 'object') {
					let defaultKey: string | null = null;
					let hasCondition = Object.keys(exportPath).some(p => p.includes("@"));
					let found = false;
					if (hasCondition) {
						for (let conditionKey of Object.keys(exportPath)) {
							const condition = conditionKey.split('@'); // Séparer la clé de la condition

							if (condition.length === 2) {
								const conditionVersion = condition[1]; // Ex: "<=5.0"

								// Vérifier si la feature et la version correspondent à une condition spécifique
								if (evaluateCondition(conditionVersion, version)) {
									loop(exportPath[conditionKey]);
									found = true;
									break; // Sortir après avoir trouvé une correspondance
								}
							}
							else {
								defaultKey = conditionKey;
							}
						}
						if (!found && defaultKey) {
							loop(exportPath[defaultKey]);
						}
					}
					else {
						const newPath = exportPath.node || exportPath.import || exportPath.types || exportPath.require || exportPath.default;
						loop(newPath);
					}
				}
				else {
					addExportPath(exportPath);
				}
			}
			for (let key in packageJson.exports) {
				const exportPaths = Array.isArray(packageJson.exports[key]) ? packageJson.exports[key] : [packageJson.exports[key]];
				for (let exportPath of exportPaths) {
					loop(exportPath);
					// if (typeof exportPath === 'object') {
					// 	const resolvedPath = exportPath.node || exportPath.import || exportPath.types || exportPath.require || exportPath.default || exportPath;
					// 	if (typeof resolvedPath === 'object') {
					// 		let defaultKey: string | null = null;
					// 		let found = false;
					// 		let hasCondition = Object.keys(resolvedPath).some(p => p.includes("@"));
					// 		if (hasCondition) {
					// 			for (let conditionKey of Object.keys(resolvedPath)) {
					// 				const condition = conditionKey.split('@'); // Séparer la clé de la condition

					// 				if (condition.length === 2) {
					// 					const conditionVersion = condition[1]; // Ex: "<=5.0"

					// 					// Vérifier si la feature et la version correspondent à une condition spécifique
					// 					if (evaluateCondition(conditionVersion, version)) {
					// 						const resolvedPath2 = resolvedPath[conditionKey].node || resolvedPath[conditionKey].import || resolvedPath[conditionKey].default || resolvedPath[conditionKey];
					// 						addExportPath(resolvedPath2);
					// 						found = true;
					// 						break; // Sortir après avoir trouvé une correspondance
					// 					}
					// 				}
					// 				else {
					// 					defaultKey = conditionKey;
					// 				}
					// 			}
					// 			if (!found && defaultKey) {
					// 				const resolvedPath2 = resolvedPath[defaultKey].node || resolvedPath[defaultKey].import || resolvedPath[defaultKey].types || resolvedPath[defaultKey].require || resolvedPath[defaultKey].default || resolvedPath[defaultKey];
					// 				addExportPath(resolvedPath2);
					// 			}
					// 		}
					// 		else {
					// 			const resolvedPath2 = resolvedPath.node || resolvedPath.import || resolvedPath.types || resolvedPath.require || resolvedPath.default || resolvedPath;
					// 			addExportPath(resolvedPath2);
					// 		}
					// 	}
					// 	else {
					// 		addExportPath(resolvedPath);
					// 	}
					// } else {
					// 	addExportPath(exportPath);
					// }
				}
			}
		}

		if (hasTs) {
			for (let e of exports) {
				if (e.endsWith(".ts")) {
					result.push(pathToUri(e));
				}
			}
		}
		else {
			for (let e of exports) {
				result.push(pathToUri(e));
			}
		}

	}
	for (let f of folders) {
		if (f.startsWith(".")) continue;

		if (f.startsWith("@")) {
			const subFolders = readdirSync(join(nodeModulesPath, f))
			for (let sf of subFolders) {
				getPackageExports(join(nodeModulesPath, f, sf));
			}
		}
		else {
			getPackageExports(join(nodeModulesPath, f));
		}
	}
	return result;
}

export function loadLibrary(name: string): string | undefined {
	let content = contents[name];
	if (typeof content === 'string') {
		return content;
	}

	let libPath;
	let showError = true;
	if (name.startsWith("custom://@types")) {
		libPath = join(NODE_MODULES(), name.replace("custom://@types", "@types"));
		showError = false;
	}
	else if (name.startsWith("file:///")) {
		if (sep === "/") {
			libPath = decodeURIComponent(name.replace("file://", ""));
		}
		else {
			libPath = decodeURIComponent(name.replace("file:///", ""));
		}

		if (libPath.indexOf("/node_modules/@typescript") != -1) {
			//showError = false;
		}
		else if (libPath.indexOf("/node_modules/@types/typescript__") != -1) {
			//showError = false;
		}
		else {
			showError = false;
		}
	}
	else if (name.startsWith("node_modules/@types/typescript__")) {
		showError = false;
	}
	else if (libsTypescript.includes(name)) {
		libPath = join(TYPESCRIPT_LIB_SOURCE(), name); // from source
	}
	else {
		libPath = name;
	}

	if (typeof content !== 'string') {
		if (existsSync(libPath) && lstatSync(libPath).isFile()) {
			content = readFileSync(libPath).toString();
		}
		else if (showError) {
			//console.error(`Unable to load library ${name} at ${libPath}`);
		}
		if (content !== undefined) {
			contents[name] = content;
		}
	}
	return content;
}


// function getServerFolder() {
// 	if (process.env["aventus_server_folder"]) {
// 		return process.env["aventus_server_folder"];
// 	}
// 	if (__dirname.endsWith("ts")) {
// 		// dev
// 		return dirname(dirname(dirname(dirname(__dirname))));
// 	}
// 	// prod
// 	return dirname(dirname(__dirname));
// }