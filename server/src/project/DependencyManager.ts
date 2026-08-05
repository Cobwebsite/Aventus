import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'fs';
import { AventusConfigBuild, AventusConfigBuildDependency, IncludeType } from '../language-services/json/definition';
import { join } from 'path';
import { AVENTUS_DEF_BASE_PATH, AVENTUS_DEF_I18N_PATH, AVENTUS_DEF_PHP_PATH, AVENTUS_DEF_SHARP_PATH, AVENTUS_DEF_UI_PATH } from '../language-services/ts/libLoader';
import { pathToUri, unlinkSync } from '../tools';
import { AventusExtension } from '../definition';
import { AventusPackageFile } from '../language-services/ts/package/File';
import { Build } from './Build';
import { get } from 'http';
import { get as gets } from 'https';
import { GenericServer } from '../GenericServer';
import { FilesManager } from '../files/FilesManager';
import { AventusFile } from '../files/AventusFile';
import { Extract } from 'unzipper'
import { Store } from '../store/Store';
import { ManifestPackage } from '../manifest/ManifestPackage';

type DependencyLoopPart = {
	file: AventusPackageFile,
	version: DependencyVersion,
	uri: string,
	include: IncludeType,
	dependencies: { name: string, include: IncludeType }[],
}
type DependencyLoop = {
	[name: string]: DependencyLoopPart
}
type DependencyVersion = { major: number, minor: number, patch: number }
export class DependencyManager {
	private path: string;

	private static instance: DependencyManager;
	public static getInstance(): DependencyManager {
		if (!this.instance) {
			this.instance = new DependencyManager();
		}
		return this.instance;
	}

	public getPath() {
		return this.path;
	}

	private constructor() {
		this.path = join(GenericServer.savePath, "packages");
		if (!existsSync(this.path)) {
			mkdirSync(this.path, { recursive: true });
		}
	}

	private predefinedPaths = {
		"Aventus@Main": AVENTUS_DEF_BASE_PATH(),
		"Aventus@UI": AVENTUS_DEF_UI_PATH(),
		"Aventus@Sharp": AVENTUS_DEF_SHARP_PATH(),
		"Aventus@Php": AVENTUS_DEF_PHP_PATH(),
		"Aventus@I18n": AVENTUS_DEF_I18N_PATH(),
	}
	private predefinedNpm = {
		"Aventus@Main": "@aventusjs/main",
		"Aventus@UI": "@aventusjs/ui",
		"Aventus@I18n": "@aventusjs/i18n",
		"Aventus@Sharp": "@aventussharp/main",
		"Aventus@Php": "@aventusphp/main",
	}
	private loadedPackages: { [name: string]: AventusPackageFile } = {};

	public get packages(): AventusPackageFile[] {
		const result: AventusPackageFile[] = [];
		for (let name in this.loadedPackages) {
			result.push(this.loadedPackages[name]);
		}
		return result;
	}
	public async loadDependenciesFromBuild(config: AventusConfigBuild, build: Build): Promise<{ files: AventusPackageFile[], dependencyNeedUris: string[], dependencyFullUris: string[], dependencyUris: string[] }> {
		let result: { files: AventusPackageFile[], dependencyNeedUris: string[], dependencyFullUris: string[], dependencyUris: string[] } = {
			files: [],
			dependencyNeedUris: [],
			dependencyFullUris: [],
			dependencyUris: [],
		};
		let loopResult: DependencyLoop = {};
		let includeNames: { [name: string]: IncludeType } = {};
		for (let name in config.dependencies) {
			const dep = config.dependencies[name];
			let tempDep = await this.loadDependency(name, dep, config, build, loopResult);
			if (tempDep) {
				includeNames[tempDep.name] = dep.include ?? "need";
			}
		}

		for (let name in loopResult) {
			if (!includeNames[name]) {
				includeNames[name] = loopResult[name].include;
			}
		}


		if (!loopResult["Aventus@Main"]) {
			await this.loadDependency("Aventus@Main", {
				uri: "",
				npm: "",
				version: "x.x.x",
				include: 'need',
				subDependenciesInclude: { ['*']: 'need' }
			}, config, build, loopResult)
		}
		if (build?.buildConfig.i18n !== undefined && !loopResult["Aventus@I18n"]) {
			await this.loadDependency("Aventus@I18n", {
				uri: "",
				npm: "",
				version: "x.x.x",
				include: 'need',
				subDependenciesInclude: { ['*']: 'need' }
			}, config, build, loopResult)
		}


		let orderedName: string[] = [];
		for (let name in loopResult) {
			let current = loopResult[name];
			this.orderLoop(name, current, loopResult, orderedName);
		}

		for (let name of orderedName) {
			let current = loopResult[name];
			current.file.loadWebComponents();
			result.files.push(current.file);
			let includeType = includeNames[name] ?? "need";
			if (includeType == "full") {
				result.dependencyFullUris.push(current.uri);
				result.dependencyUris.push(current.uri);
			}
			else if (includeType == "need") {
				result.dependencyNeedUris.push(current.uri);
				result.dependencyUris.push(current.uri);
			}

		}
		return result;
	}

	private orderLoop(name: string, dep: DependencyLoopPart, allInfo: DependencyLoop, orderedName: string[]) {
		let index = orderedName.indexOf(name);
		if (index != -1) {
			return index + 1;
		}
		let insertIndex = 0;
		for (let depName of dep.dependencies) {
			if (allInfo[depName.name]) {
				let insertIndexTemp = this.orderLoop(depName.name, allInfo[depName.name], allInfo, orderedName);
				if (insertIndexTemp >= 0 && insertIndexTemp > insertIndex) {
					insertIndex = insertIndexTemp;
				}
			}
		}

		orderedName.splice(insertIndex, 0, name);
		return orderedName.length;
	}
	// TODO manage error during process
	private async loadDependency(name: string, dep: AventusConfigBuildDependency, config: AventusConfigBuild, build: Build, result: DependencyLoop) {
		let packageFile: AventusPackageFile | undefined;
		let finalUri: string | undefined;
		if (this.predefinedPaths[name]) {
			dep.uri = this.predefinedPaths[name] as string;
			let uri = pathToUri(dep.uri);
			packageFile = await this.loadByUri(build, uri);
			finalUri = uri;
		}
		else if (dep.uri) {
			if (dep.uri.startsWith("http")) {
				GenericServer.showErrorMessage("http package isn't supported right now. Plz use the store");
				// if (!dep.version) {

				// }
				// let http = await this.loadHttp(dep.uri, dep.version, build);
				// if (http) {
				// 	packageFile = http.file;
				// 	finalUri = http.uri;
				// }
			}
			else {
				let uri = pathToUri(dep.uri);
				packageFile = await this.loadByUri(build, uri);
				finalUri = uri;
			}
		}
		else if (dep.isLocal) {
			let local = await this.loadLocal(name, build);
			packageFile = local.file;
			finalUri = local.uri;
		}
		else {
			if (dep.version) {
				let storeInfo = await this.loadStore(name, dep.version, build);
				if (!storeInfo) {
					GenericServer.showErrorMessage("Can't load " + name + " from the store");
				}
				else {
					packageFile = storeInfo.file;
					finalUri = storeInfo.uri;
				}
			}
			else {
				GenericServer.showErrorMessage("You need to define a version to load a package via the store (" + name + ")");
			}
		}


		if (finalUri && packageFile) {
			const version = dep.version ? this.parseVersion(dep.version) : { major: -1, minor: -1, patch: -1 };

			if (dep.npm) {
				packageFile.npmUri = dep.npm;
			}
			else if (this.predefinedNpm[name]) {
				packageFile.npmUri = this.predefinedNpm[name];
			}
			else {
				let npmInfo = /\/\/ npm:(.*)$/m.exec(packageFile.file.contentUser);
				if (npmInfo) {
					packageFile.npmUri = npmInfo[1];
				}
			}

			let description = /\/\* description:(.*) \*\//gm.exec(packageFile.file.contentUser);
			if (description) {
				packageFile.description = description[1];
			}

			const setDependency = async (file: AventusPackageFile, uri: string) => {
				result[file.name] = {
					file,
					uri,
					include: dep.include ?? 'need',
					version: version,
					dependencies: [],
				}

				for (let name in file.dependencies) {
					let dep = file.dependencies[name];
					if (typeof dep == 'string') {
						dep = {
							version: dep
						}
					}
					// include if root package need include
					let resultDep = await this.loadDependency(name, dep, config, build, result);
					if (resultDep) {
						const item = result[file.name].dependencies.find(p => p.name == resultDep.name);
						let type: IncludeType = "need"
						if (dep.subDependenciesInclude && dep.subDependenciesInclude[resultDep.name]) {
							type = dep.subDependenciesInclude[resultDep.name]
						}
						if (!item) {
							result[file.name].dependencies.push({ name: resultDep.name, include: type })
						}
						else {
							if (item.include == 'none' && type != 'none') {
								item.include = type;
							}
							else if (item.include == 'need' && type == 'full') {
								item.include = type;
							}
						}
					}
				}
				if (file.name != "Aventus@Main") {
					// force aventus to be a dependency
					if (!result[file.name].dependencies.find(p => p.name == "Aventus@Main")) {
						result[file.name].dependencies.push({
							name: "Aventus@Main",
							include: "need"
						});
					}
				}
			}

			if (!result[packageFile.name]) {
				await setDependency(packageFile, finalUri);
			}
			else {
				let usedVersion = result[packageFile.name].version;
				let versionToUse = this.compareVersion(usedVersion, version, packageFile.name);
				// we need to change the version used bc the selected version is the second parameter
				if (versionToUse == version) {
					await setDependency(packageFile, finalUri);
				}

			}

			ManifestPackage.register(packageFile);
		}

		return packageFile;
	}


	private async loadByUri(build: Build, uri: string): Promise<AventusPackageFile | undefined> {
		let file = await FilesManager.getInstance().registerFilePackage(uri)
		return this.loadPackage(file, build);
	}


	private async loadLocal(localName: string, build: Build) {
		let uri = pathToUri(join(this.path, "@locals", localName))
		if (!uri.endsWith(AventusExtension.Package)) {
			uri += AventusExtension.Package;
		}
		let file = await FilesManager.getInstance().registerFilePackage(uri)
		const packageFile = this.loadPackage(file, build);
		return {
			uri,
			file: packageFile
		}
	}

	private async loadStore(name: string, version: string, build: Build) {
		let uri = join(this.path, "store", name, version);
		let uriExist = existsSync(uri);
		const { major, minor, patch } = this.parseVersion(version);
		let packageTempPath: string | null = null;
		if (uriExist) {
			packageTempPath = this.findPackage(uri);
			if (!packageTempPath) {
				uriExist = false
			}
		}
		if (!uriExist) {
			if (existsSync(uri)) {
				rmSync(uri, { force: true, recursive: true });
			}
			mkdirSync(uri, { recursive: true });
			let downloadPath = join(uri, "temp.zip");
			if (!await this.downloadFile(downloadPath, Store.url + `/package/download/${name}/${version}`)) {
				return null;
			}

			if (!await this.extractZip(downloadPath, uri)) {
				return null;
			}
			rmSync(downloadPath, { force: true });

			packageTempPath = this.findPackage(uri);
			if (!packageTempPath) return;

			let firstLine = await this.readFirstLine(packageTempPath);
			let regexInfo = /\/\/ (\S+):([0-9]+)\.([0-9]+)\.([0-9]+)/g.exec(firstLine);
			if (!regexInfo) {
				console.error(`Invalid package header for "${name}@${version}". First line:`, JSON.stringify(firstLine));
				return null;
			}
			let packageName = regexInfo[1];
			let v1 = Number(regexInfo[2]);
			let v2 = Number(regexInfo[3]);
			let v3 = Number(regexInfo[4]);
			let packageVersion = v1 + '.' + v2 + '.' + v3;

			if (packageName !== name) {
				console.error(
					`Package name mismatch: requested "${name}", downloaded "${packageName}"`
				);
				return null;
			}

			if (packageVersion !== version) {
				console.error(
					`Package version mismatch: requested "${version}", downloaded "${packageVersion}"`
				);
				return null;
			}
		}

		if (!packageTempPath) {
			console.error(`Package file not found after extracting "${name}@${version}" into "${uri}"`);
			return null;
		}
		const packageUri = pathToUri(packageTempPath);
		let file = await FilesManager.getInstance().registerFilePackage(packageUri)
		const packageFile = this.loadPackage(file, build);
		return {
			uri: packageUri,
			file: packageFile
		}
	}
	private extractZip(zipPath: string, outputDir: string) {
		return new Promise<boolean>((resolve) => {
			let completed = false;

			const finish = (result: boolean) => {
				if (completed) return;
				completed = true;
				resolve(result);
			};

			const input = createReadStream(zipPath);
			const extractor = Extract({ path: outputDir });

			input.on("error", (error) => {
				console.error(`Can't read ZIP "${zipPath}":`, error);
				finish(false);
			});

			extractor.on("close", () => finish(true));

			extractor.on("error", (error) => {
				console.error(`Can't extract ZIP "${zipPath}":`, error);
				if ((error + '').includes("Error: invalid signature: 0x4f44213c")) {
					console.log(readFileSync(zipPath, 'utf8'));
				}
				finish(false);
			});

			input.pipe(extractor);
		});
	}
	private findPackage(path: string): string | null {
		let result: string | null = null;
		const elements = readdirSync(path);
		for (let element of elements) {
			if (element.endsWith(AventusExtension.Package)) {
				result = join(path, element);
				break;
			}
		}
		return result;
	}
	// private async loadHttp(uri: string, version: string, build: Build) {
	// 	try {
	// 		let Md5 = md5(uri);
	// 		let uriMd5 = join(this.path, "http", Md5);
	// 		let infoFile = join(uriMd5, "info.json");
	// 		let md5Exist = existsSync(uriMd5);
	// 		let packagePath: string | null = null;
	// 		// const { major, minor, patch } = this.parseVersion(version);
	// 		if (!md5Exist || !existsSync(infoFile)) {
	// 			if (uri.endsWith(AventusExtension.Package)) {
	// 				if (!md5Exist) {
	// 					mkdirSync(uriMd5, { recursive: true });
	// 				}
	// 				let downloadPath = join(uriMd5, "temp.package.avt");
	// 				if (!await this.downloadFile(downloadPath, uri)) {
	// 					return null;
	// 				}
	// 				let firstLine = await this.readFirstLine(downloadPath);
	// 				let regexInfo = /\/\/ (\S+):([0-9]+)\.([0-9]+)\.([0-9]+)/g.exec(firstLine);
	// 				if (regexInfo) {
	// 					let name = regexInfo[1];
	// 					let v1 = Number(regexInfo[2]);
	// 					let v2 = Number(regexInfo[3]);
	// 					let v3 = Number(regexInfo[4]);

	// 					let info = {
	// 						name: name,
	// 						versions: {
	// 							[v1]: {
	// 								[v2]: {
	// 									[v3]: {
	// 										uri: uri,
	// 										localUri: name + "#" + v1 + "." + v2 + "." + v3 + AventusExtension.Package
	// 									}
	// 								}
	// 							}
	// 						}
	// 					}

	// 					writeFileSync(infoFile, JSON.stringify(info, null, 4));
	// 					renameSync(downloadPath, join(uriMd5, name + "#" + v1 + "." + v2 + "." + v3 + AventusExtension.Package));
	// 					packagePath = name + "#" + v1 + "." + v2 + "." + v3 + AventusExtension.Package;
	// 				}
	// 			}
	// 			else {
	// 				if (!await this.downloadFile(infoFile, uri)) {
	// 					return null;
	// 				}
	// 			}
	// 		}

	// 		let info = JSON.parse(readFileSync(infoFile, 'utf8'));

	// 		let loopVersion = (v: number, obj: any) => {
	// 			if (v == -1) {
	// 				let max = Math.max.apply(null, Object.keys(obj) as any);
	// 				return {
	// 					obj: obj[max + ""],
	// 					v: max
	// 				}
	// 			}
	// 			return {
	// 				obj: obj[v + ""],
	// 				v: v
	// 			}

	// 		}
	// 		// let findVersion = () => {
	// 		// 	let majorInfo = loopVersion(major, info.versions);
	// 		// 	if (majorInfo.obj !== undefined) {
	// 		// 		let minorInfo = loopVersion(minor, majorInfo.obj);
	// 		// 		if (minorInfo.obj !== undefined) {
	// 		// 			let patchInfo = loopVersion(patch, minorInfo.obj);
	// 		// 			if (patchInfo.obj !== undefined) {
	// 		// 				return {
	// 		// 					info: patchInfo.obj as { uri: string, localUri?: string },
	// 		// 					number: majorInfo.v + "." + minorInfo.v + "." + patchInfo.v
	// 		// 				}
	// 		// 			}
	// 		// 		}
	// 		// 	}
	// 		// 	return null;
	// 		// }

	// 		// let versionToUse = findVersion();
	// 		if (versionToUse) {
	// 			if (versionToUse.info.localUri && existsSync(join(uriMd5, versionToUse.info.localUri))) {
	// 				let packageUri = pathToUri(join(uriMd5, versionToUse.info.localUri));
	// 				let file = await FilesManager.getInstance().registerFilePackage(packageUri)
	// 				const packageFile = this.loadPackage(file, build);
	// 				return {
	// 					uri: packageUri,
	// 					file: packageFile
	// 				}
	// 			}
	// 			else {
	// 				let localUri = info.name + "#" + versionToUse.number + AventusExtension.Package;
	// 				let packageUri = pathToUri(join(uriMd5, localUri));
	// 				if (!await this.downloadFile(join(uriMd5, localUri), versionToUse.info.uri)) {
	// 					return null;
	// 				}
	// 				versionToUse.info.localUri = localUri;
	// 				let file = await FilesManager.getInstance().registerFilePackage(packageUri)
	// 				writeFileSync(infoFile, JSON.stringify(info, null, 4));
	// 				const packageFile = this.loadPackage(file, build);
	// 				return {
	// 					uri: packageUri,
	// 					file: packageFile
	// 				}
	// 			}
	// 		}
	// 	}
	// 	catch (e) {

	// 	}
	// 	return null;
	// }

	private loadPackage(file: AventusFile, build: Build): AventusPackageFile | undefined {
		const info = AventusPackageFile.getQuickInfo(file);
		if (!info) {
			return undefined;
		}
		this.loadedPackages[info.name] = new AventusPackageFile(file, build)
		return this.loadedPackages[info.name];
	}

	private downloadFile(fileUri: string, httpUri: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {

			const cleanup = () => {
				try {
					if (existsSync(fileUri)) {
						unlinkSync(fileUri);
					}
				}
				catch {
					// Ignore cleanup errors
				}
			};

			const requestFunction = httpUri.startsWith("https:") ? gets : get;

			const request = requestFunction(httpUri, (response) => {
				const statusCode = response.statusCode ?? 0;

				if (
					statusCode >= 300 &&
					statusCode < 400 &&
					response.headers.location
				) {
					response.resume();

					this.downloadFile(fileUri, response.headers.location)
						.then(resolve)
						.catch(() => resolve(false));

					return;
				}

				if (statusCode < 200 || statusCode >= 300) {
					console.error(
						`Download failed: HTTP ${statusCode} for ${httpUri}`
					);

					response.resume();
					cleanup();
					resolve(false);
					return;
				}

				const file = createWriteStream(fileUri);

				file.on("error", (error) => {
					console.error(`File write error for ${fileUri}:`, error);
					response.destroy();
					cleanup();
					resolve(false);
				});

				response.on("error", (error) => {
					console.error(`HTTP response error for ${httpUri}:`, error);
					file.destroy();
					cleanup();
					resolve(false);
				});

				file.on("finish", () => {
					file.close((error) => {
						if (error) {
							console.error(`File close error for ${fileUri}:`, error);
							cleanup();
							resolve(false);
							return;
						}

						resolve(true);
					});
				});

				response.pipe(file);
			});

			request.on("error", (error) => {
				console.error(`HTTP request error for ${httpUri}:`, error);
				cleanup();
				resolve(false);
			});
		})
	}

	private readFirstLine(path: string): Promise<string> {
		return new Promise(function (resolve, reject) {
			var rs = createReadStream(path, { encoding: 'utf8' });
			var acc = '';
			var pos = 0;
			var index;
			rs
				.on('data', function (chunk) {
					index = chunk.indexOf('\n');
					acc += chunk;
					index !== -1 ? rs.close() : pos += chunk.length;
				})
				.on('close', function () {
					resolve(acc.slice(0, pos + index));
				})
				.on('error', function (err) {
					reject(err);
				})
		});
	}

	private parseVersion(versionTxt: string): DependencyVersion {
		let regexVersion = /([0-9xX]+)\.([0-9xX]+)\.([0-9xX]+)/g.exec(versionTxt) ?? [0, -1, -1, -1];
		let major = isNaN(Number(regexVersion[1])) ? -1 : Number(regexVersion[1]);
		let minor = isNaN(Number(regexVersion[2])) ? -1 : Number(regexVersion[2]);
		let patch = isNaN(Number(regexVersion[3])) ? -1 : Number(regexVersion[3]);
		return { major, minor, patch };
	}

	private compareVersion(v1: DependencyVersion, v2: DependencyVersion, name: string) {
		let loop = (step: "major" | "minor" | "patch") => {
			if (v1[step] == -1) {
				if (v2[step] == -1) {
					return null;
				}
				else {
					return v2;
				}
			}
			else if (v2[step] == -1) {
				return v1;
			}
			else if (v1[step] == v2[step]) {
				return null;
			}
			else {
				// error
				let v1Txt = Object.values(v1).join(".");
				let v2Txt = Object.values(v2).join(".");
				GenericServer.showErrorMessage(`Can't resolve version for dependency ${name} between ${v1Txt} and ${v2Txt}`);
				return -1;
			}
		}

		let lvls: ["major", "minor", "patch"] = ["major", "minor", "patch"];
		for (let lvl of lvls) {
			let temp = loop(lvl);
			// error
			if (typeof temp == 'number') {
				return null;
			}
			// find the version
			else if (temp) {
				return temp;
			}
		}
		// everythink is x.x.x
		return v1;
	}
}