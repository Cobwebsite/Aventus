import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs';
import { AventusConfigBuild, AventusConfigBuildDependance, IncludeType } from '../language-services/json/definition';
import * as md5 from 'md5';
import { join, normalize } from 'path';
import { AVENTUS_DEF_BASE_PATH, AVENTUS_DEF_UI_PATH } from '../language-services/ts/libLoader';
import { FilesWatcher } from '../files/FilesWatcher';
import { pathToUri } from '../tools';
import { AventusExtension, AventusLanguageId } from '../definition';
import { AventusPackageFile } from '../language-services/ts/package/File';
import { Build } from './Build';
import { get } from 'http';
import { GenericServer } from '../GenericServer';

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
		"@Aventus": AVENTUS_DEF_BASE_PATH,
		"@AventusUI": AVENTUS_DEF_UI_PATH,
	}
	private aventusLoaded: boolean = false;
	public async loadDependancesFromBuild(config: AventusConfigBuild, build: Build): Promise<{ files: AventusPackageFile[], dependanceNeedUris: string[], dependanceFullUris: string[], dependanceUris: string[] }> {
		this.aventusLoaded = false;
		let result: { files: AventusPackageFile[], dependanceNeedUris: string[], dependanceFullUris: string[], dependanceUris: string[] } = {
			files: [],
			dependanceNeedUris: [],
			dependanceFullUris: [],
			dependanceUris: [],
		};
		let loopResult: DependanceLoop = {};
		let includeNames: { [name: string]: IncludeType } = {};
		for (let dep of config.dependances) {
			let tempDep = await this.loadDependance(dep, config, build, loopResult);
			if (tempDep) {
				includeNames[tempDep.name] = dep.include;
			}
			includeNames = { ...includeNames, ...dep.subDependancesInclude };
		}

		if (!this.aventusLoaded) {
			let uri = pathToUri(AVENTUS_DEF_BASE_PATH);
			let avFile = this.loadByUri(build, uri)
			loopResult["Aventus"] = {
				dependances: [],
				file: avFile,
				uri: uri,
				version: avFile.version
			}
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

	private async loadDependance(dep: AventusConfigBuildDependance, config: AventusConfigBuild, build: Build, result: DependanceLoop) {
		let packageFile: AventusPackageFile | undefined;
		let finalUri: string | undefined;
		if (dep.uri.match("^(@|&)")) {
			let regexTemp: RegExpExecArray | null;
			if (this.predefinedPaths[dep.uri]) {
				let uri = pathToUri(this.predefinedPaths[dep.uri]);
				packageFile = this.loadByUri(build, uri);
				finalUri = uri;
				if (dep.uri == "@Aventus") {
					this.aventusLoaded = true;
				}
			}

			else if ((regexTemp = /@local:(\S+)/g.exec(dep.uri))) {
				let local = this.loadLocal(regexTemp[1], build);
				packageFile = local.file;
				finalUri = local.uri;
			}
			else if ((regexTemp = /&:(\S+)/g.exec(dep.uri))) {
				let localName = config.module + "@" + regexTemp[1] + AventusExtension.Package;
				let local = this.loadLocal(localName, build);
				packageFile = local.file;
				finalUri = local.uri;
			}
			else if ((regexTemp = /@npm:(\S+)/g.exec(dep.uri))) {
				let npmName = regexTemp[1];
			}
		}
		else {
			if (dep.uri.startsWith("http")) {
				let http = await this.loadHttp(dep.uri, dep.version, build);
				if (http) {
					packageFile = http.file;
					finalUri = http.uri;
				}
			}
			else {
				// path
				let pathToImport = dep.uri;
				if (dep.uri.startsWith(".")) {
					pathToImport = build.project.getConfigFile().folderPath + '/' + dep.uri;
				}
				pathToImport = normalize(pathToImport);
				let uri = pathToUri(pathToImport);
				packageFile = this.loadByUri(build, uri);
				finalUri = uri;
			}
		}


		if (finalUri && packageFile) {
			const version = this.parseVersion(dep.version);

			const setDependance = async (file: AventusPackageFile, uri: string) => {
				result[file.name] = {
					file,
					uri,
					version: version,
					dependances: [],
				}
				if (file.name != "Aventus@Main") {
					result[file.name].dependances = ['Aventus@Main'] // force aventus to be a dependance
				}
				for (let dep of file.dependances) {
					// include if root package need include
					let resultDep = await this.loadDependance(dep, config, build, result);
					if (resultDep) {
						if (!result[file.name].dependances.includes(resultDep.name)) {
							result[file.name].dependances.push(resultDep.name);
						}
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


	private loadByUri(build: Build, uri: string): AventusPackageFile {
		let file = FilesWatcher.getInstance().registerFile(uri, AventusLanguageId.Package);
		return new AventusPackageFile(file, build);
	}


	private loadLocal(localName: string, build: Build) {
		let uri = pathToUri(join(this.path, "@locals", localName))
		let file = FilesWatcher.getInstance().registerFile(uri, AventusLanguageId.Package);
		return {
			uri,
			file: new AventusPackageFile(file, build)
		}
	}

	private async loadHttp(uri: string, version: string, build: Build) {
		try {
			let Md5 = md5(uri);
			let uriMd5 = join(this.path, "http", Md5);
			let infoFile = join(uriMd5, "info.json");
			let md5Exist = existsSync(uriMd5);
			const { major, minor, patch } = this.parseVersion(version);
			if (!md5Exist || !existsSync(infoFile)) {
				if (uri.endsWith(AventusExtension.Package)) {
					if (!md5Exist) {
						mkdirSync(uriMd5, { recursive: true });
					}
					let downloadPath = join(uriMd5, "temp.package.avt");
					if (!await this.downloadFile(downloadPath, uri)) {
						return null;
					}
					let firstLine = await this.readFirstLine(downloadPath);
					let regexInfo = /\/\/ (\S+):([0-9]+)\.([0-9]+)\.([0-9]+)/g.exec(firstLine);
					if (regexInfo) {
						let name = regexInfo[1];
						let v1 = Number(regexInfo[2]);
						let v2 = Number(regexInfo[3]);
						let v3 = Number(regexInfo[4]);

						let info = {
							name: name,
							versions: {
								[v1]: {
									[v2]: {
										[v3]: {
											uri: uri,
											localUri: name + "#" + v1 + "." + v2 + "." + v3 + AventusExtension.Package
										}
									}
								}
							}
						}

						writeFileSync(infoFile, JSON.stringify(info, null, 4));
						renameSync(downloadPath, join(uriMd5, name + "#" + v1 + "." + v2 + "." + v3 + AventusExtension.Package));
					}
				}
				else {
					if (!await this.downloadFile(infoFile, uri)) {
						return null;
					}
				}
			}

			let info = JSON.parse(readFileSync(infoFile, 'utf8'));

			let loopVersion = (v: number, obj: any) => {
				if (v == -1) {
					let max = Math.max.apply(null, Object.keys(obj) as any);
					return {
						obj: obj[max + ""],
						v: max
					}
				}
				return {
					obj: obj[v + ""],
					v: v
				}

			}
			let findVersion = () => {
				let majorInfo = loopVersion(major, info.versions);
				if (majorInfo.obj !== undefined) {
					let minorInfo = loopVersion(minor, majorInfo.obj);
					if (minorInfo.obj !== undefined) {
						let patchInfo = loopVersion(patch, minorInfo.obj);
						if (patchInfo.obj !== undefined) {
							return {
								info: patchInfo.obj as { uri: string, localUri?: string },
								number: majorInfo.v + "." + minorInfo.v + "." + patchInfo.v
							}
						}
					}
				}
				return null;
			}

			let versionToUse = findVersion();
			if (versionToUse) {
				if (versionToUse.info.localUri && existsSync(join(uriMd5, versionToUse.info.localUri))) {
					let packageUri = pathToUri(join(uriMd5, versionToUse.info.localUri));
					let file = FilesWatcher.getInstance().registerFile(packageUri, AventusLanguageId.Package);
					return {
						uri: packageUri,
						file: new AventusPackageFile(file, build)
					}
				}
				else {
					let localUri = info.name + "#" + versionToUse.number + AventusExtension.Package;
					let packageUri = pathToUri(join(uriMd5, localUri));
					if (!await this.downloadFile(join(uriMd5, localUri), versionToUse.info.uri)) {
						return null;
					}
					versionToUse.info.localUri = localUri;
					let file = FilesWatcher.getInstance().registerFile(packageUri, AventusLanguageId.Package);
					writeFileSync(infoFile, JSON.stringify(info, null, 4));
					return {
						uri: packageUri,
						file: new AventusPackageFile(file, build)
					}
				}
			}
		}
		catch (e) {

		}
		return null;
	}

	private downloadFile(fileUri: string, httpUri: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			const file = createWriteStream(fileUri);
			try {
				get(httpUri, function (response) {
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