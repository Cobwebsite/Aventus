import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmdirSync, rmSync, unlinkSync, writeFileSync } from 'fs';
import { AventusConfigBuild, AventusConfigBuildDependance, IncludeType } from '../language-services/json/definition';
import * as md5 from 'md5';
import { join, normalize } from 'path';
import { AVENTUS_DEF_BASE_PATH, AVENTUS_DEF_I18N_PATH, AVENTUS_DEF_PHP_PATH, AVENTUS_DEF_SHARP_PATH, AVENTUS_DEF_UI_PATH } from '../language-services/ts/libLoader';
import { pathToUri } from '../tools';
import { AventusExtension, AventusLanguageId } from '../definition';
import { AventusPackageFile } from '../language-services/ts/package/File';
import { Build } from './Build';
import { get } from 'http';
import { get as gets } from 'https';
import { GenericServer } from '../GenericServer';
import { FilesManager } from '../files/FilesManager';
import { AventusFile } from '../files/AventusFile';
import { Extract } from 'unzipper'
import { Store } from '../store/Store';

type DependanceLoopPart = {
	file: AventusPackageFile,
	version: DependanceVersion,
	uri: string,
	dependances: string[],
}
type DependanceLoop = {
	[name: string]: DependanceLoopPart
}
type DependanceVersion = { major: number, minor: number, patch: number }
export class DependanceManager {
	private path: string;

	private static instance: DependanceManager;
	public static getInstance(): DependanceManager {
		if (!this.instance) {
			this.instance = new DependanceManager();
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
	private loadedPackages: { [name: string]: { [version: string]: AventusPackageFile } } = {};
	public async loadDependancesFromBuild(config: AventusConfigBuild, build: Build): Promise<{ files: AventusPackageFile[], dependanceNeedUris: string[], dependanceFullUris: string[], dependanceUris: string[] }> {
		let result: { files: AventusPackageFile[], dependanceNeedUris: string[], dependanceFullUris: string[], dependanceUris: string[] } = {
			files: [],
			dependanceNeedUris: [],
			dependanceFullUris: [],
			dependanceUris: [],
		};
		let loopResult: DependanceLoop = {};
		let includeNames: { [name: string]: IncludeType } = {};
		for (let name in config.dependances) {
			const dep = config.dependances[name];
			let tempDep = await this.loadDependance(name, dep, config, build, loopResult);
			if (tempDep) {
				includeNames[tempDep.name] = dep.include ?? "need";
			}
			includeNames = { ...includeNames, ...dep.subDependancesInclude };
		}

		if (!loopResult["Aventus@Main"]) {
			await this.loadDependance("Aventus@Main", {
				uri: "",
				npm: "",
				version: "x.x.x",
				include: 'need',
				subDependancesInclude: { ['*']: 'need' }
			}, config, build, loopResult)
		}
		if (build.buildConfig.i18n !== undefined && !loopResult["Aventus@I18n"]) {
			await this.loadDependance("Aventus@I18n", {
				uri: "",
				npm: "",
				version: "x.x.x",
				include: 'need',
				subDependancesInclude: { ['*']: 'need' }
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
			let nameTemp = includeNames[name] ? name : "*";
			if (includeNames[nameTemp]) {
				if (includeNames[nameTemp] == "full") {
					result.dependanceFullUris.push(current.uri);
					result.dependanceUris.push(current.uri);
				}
				else if (includeNames[nameTemp] == "need") {
					result.dependanceNeedUris.push(current.uri);
					result.dependanceUris.push(current.uri);
				}
			}
			else {
				result.dependanceNeedUris.push(current.uri);
				result.dependanceUris.push(current.uri);
			}
		}
		return result;
	}

	private orderLoop(name: string, dep: DependanceLoopPart, allInfo: DependanceLoop, orderedName: string[]) {
		let index = orderedName.indexOf(name);
		if (index != -1) {
			return index + 1;
		}
		let insertIndex = 0;
		for (let depName of dep.dependances) {
			if (allInfo[depName]) {
				let insertIndexTemp = this.orderLoop(depName, allInfo[depName], allInfo, orderedName);
				if (insertIndexTemp >= 0 && insertIndexTemp > insertIndex) {
					insertIndex = insertIndexTemp;
				}
			}
		}

		orderedName.splice(insertIndex, 0, name);
		return orderedName.length;
	}
	// TODO manage error during process
	private async loadDependance(name: string, dep: AventusConfigBuildDependance, config: AventusConfigBuild, build: Build, result: DependanceLoop) {
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
				GenericServer.showErrorMessage("You need to define a version to load a package via the store");
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

			const setDependance = async (file: AventusPackageFile, uri: string) => {
				result[file.name] = {
					file,
					uri,
					version: version,
					dependances: [],
				}

				for (let name in file.dependances) {
					const dep = file.dependances[name];
					// include if root package need include
					let resultDep = await this.loadDependance(name, dep, config, build, result);
					if (resultDep) {
						if (!result[file.name].dependances.includes(resultDep.name)) {
							result[file.name].dependances.push(resultDep.name);
						}

					}
				}
				if (file.name != "Aventus@Main") {
					// force aventus to be a dependance
					if (!result[file.name].dependances.includes("Aventus@Main")) {
						result[file.name].dependances.push("Aventus@Main");
					}
				}
			}

			if (!result[packageFile.name]) {
				await setDependance(packageFile, finalUri);
			}
			else {
				let usedVersion = result[packageFile.name].version;
				let versionToUse = this.compareVersion(usedVersion, version, packageFile.name);
				// we need to change the version used bc the selected version is the second parameter
				if (versionToUse == version) {
					await setDependance(packageFile, finalUri);
				}

			}
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
			if (!regexInfo) return null;
			let packageName = regexInfo[1];
			let v1 = Number(regexInfo[2]);
			let v2 = Number(regexInfo[3]);
			let v3 = Number(regexInfo[4]);
			let packageVersion = v1 + '.' + v2 + '.' + v3;

		}

		if (!packageTempPath) return null;

		let file = await FilesManager.getInstance().registerFilePackage(packageTempPath)
		const packageFile = this.loadPackage(file, build);
		return {
			uri: packageTempPath,
			file: packageFile
		}
	}
	private extractZip(zipPath: string, outputDir: string) {
		return new Promise<boolean>((resolve) => {
			createReadStream(zipPath)
				.pipe(Extract({ path: outputDir }))
				.on("close", () => resolve(true))
				.on("error", (err) => {
					console.error("Extract error ", err)
					resolve(false)
				});
		})
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
		return new AventusPackageFile(file, build);
		// const info = AventusPackageFile.getQuickInfo(file);
		// if (!info) {
		// 	return undefined;
		// }
		// const v = info.version.major + "." + info.version.minor + "." + info.version.patch;
		// if (!this.loadedPackages[info.name]) {
		// 	this.loadedPackages[info.name] = {};
		// }
		// if (!this.loadedPackages[info.name][v]) {
		// 	this.loadedPackages[info.name][v] = new AventusPackageFile(file, build)
		// }
		// return this.loadedPackages[info.name][v]
	}

	private downloadFile(fileUri: string, httpUri: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			const file = createWriteStream(fileUri);
			try {
				let fct = httpUri.startsWith("https") ? gets : get
				fct(httpUri, function (response) {
					response.pipe(file);

					// after download completed close filestream
					file.on("finish", () => {
						file.close();
						resolve(true);
					});
					file.on("error", () => {
						file.close();
						unlinkSync(fileUri);
						resolve(false);
					})
				});
			} catch (e) {
				file.close();
				unlinkSync(fileUri);
				resolve(false);
			}

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

	private parseVersion(versionTxt: string): DependanceVersion {
		let regexVersion = /([0-9xX]+)\.([0-9xX]+)\.([0-9xX]+)/g.exec(versionTxt) ?? [0, -1, -1, -1];
		let major = isNaN(Number(regexVersion[1])) ? -1 : Number(regexVersion[1]);
		let minor = isNaN(Number(regexVersion[2])) ? -1 : Number(regexVersion[2]);
		let patch = isNaN(Number(regexVersion[3])) ? -1 : Number(regexVersion[3]);
		return { major, minor, patch };
	}

	private compareVersion(v1: DependanceVersion, v2: DependanceVersion, name: string) {
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
				GenericServer.showErrorMessage(`Can't resolve version for dependance ${name} between ${v1Txt} and ${v2Txt}`);
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