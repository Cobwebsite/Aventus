/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { join, resolve, sep } from 'path';
import { readFileSync, existsSync, readdirSync, lstatSync } from 'fs';
import { GenericServer } from '../../GenericServer';
import { pathToUri } from '../../tools';
import { version } from 'typescript';

const contents: { [name: string]: { content: string, mtimeMs: number, ctimeMs: number, size: number } } = {};




export const serverFolder = () => GenericServer.extensionPath;
let _node_modules_folder: string | undefined = undefined;
const node_modules_folder = () => {
	if (_node_modules_folder !== undefined) return _node_modules_folder;

	let currentPath = serverFolder();
	while (currentPath !== resolve(currentPath, '..')) {
		const tsLibPath = join(currentPath, 'node_modules/typescript/lib');
		if (existsSync(tsLibPath)) {
			_node_modules_folder = currentPath;
			return _node_modules_folder;
		}
		currentPath = resolve(currentPath, '..');
	}
	return serverFolder();

};
export const TYPESCRIPT_LIB_SOURCE = () => join(node_modules_folder(), 'node_modules/typescript/lib');
export const AVENTUS_DEF_BASE_PATH = () => join(serverFolder(), 'lib/Aventus@Main.package.avt');
export const AVENTUS_DEF_UI_PATH = () => join(serverFolder(), 'lib/Aventus@UI.package.avt');
export const AVENTUS_DEF_I18N_PATH = () => join(serverFolder(), 'lib/Aventus@I18n.package.avt');
export const AVENTUS_DEF_SHARP_PATH = () => join(serverFolder(), 'lib/Aventus@Sharp.package.avt');
export const AVENTUS_DEF_PHP_PATH = () => join(serverFolder(), 'lib/Aventus@Php.package.avt');
export const NODE_MODULES = () => join(node_modules_folder(), 'node_modules');

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
		let packageJson;
		try {
			packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
		}
		catch (error) {
			console.error(`Unable to read npm package metadata at ${packageJsonPath}: ${error}`);
			return;
		}

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
						const paths = [exportPath.types, exportPath.node, exportPath.import, exportPath.require, exportPath.default];
						for (const path of paths) {
							if (!path) continue;
							if (typeof path === 'string') {
								if (!existsSync(resolve(modulePath, path))) continue;
								loop(path);
								break;
							}
							const count = exports.length;
							loop(path);
							if (exports.length > count) break;
						}
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

	if (typeof libPath == 'string' && existsSync(libPath)) {
		const stat = lstatSync(libPath);
		if (stat.isFile()) {
			const cached = contents[name];
			if (cached && cached.mtimeMs === stat.mtimeMs && cached.ctimeMs === stat.ctimeMs && cached.size === stat.size) {
				return cached.content;
			}
			const content = readFileSync(libPath).toString();
			contents[name] = { content, mtimeMs: stat.mtimeMs, ctimeMs: stat.ctimeMs, size: stat.size };
			return content;
		}
	}
	delete contents[name];
	if (showError) {
		//console.error(`Unable to load library ${name} at ${libPath}`);
	}
	return undefined;
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
