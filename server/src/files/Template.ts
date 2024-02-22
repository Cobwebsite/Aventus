import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, rmdirSync, statSync, writeFileSync } from 'fs';
import { join, normalize, sep } from 'path';
import { pathToFileURL } from 'url';

import { ExecSyncOptionsWithBufferEncoding, execSync } from 'child_process';
import { pathToUri, uriToPath } from '../tools';
import { ProjectManager } from '../project/ProjectManager';
import { FilesManager } from './FilesManager';
import { GenericServer } from '../GenericServer';
import { SelectItem } from '../IConnection';


export interface TemplateConfigVariable {
	question: string,
	type: 'input' | 'choice',
	defaultValue: '',
	list: { [value: string]: string },
	validation?: {
		pattern: string,
		errorMsg?: string,
	}[],
}

export interface TemplateConfig {
	"name": string,
	"description": string,
	"version": string,
	"variables": { [name: string]: TemplateConfigVariable },
	"filesToOpen"?: string[],
	"cmdsAfter"?: string[],
}

export class Template {
	public config: TemplateConfig;
	public folderPath: string;
	public currentVars: { [name: string]: string } = {};
	public configVars: string[] | undefined;
	public currentConfig: TemplateConfig;
	private filesToOpen: string[] = [];

	public constructor(config: TemplateConfig, folderPath: string) {
		this.config = config;
		this.currentConfig = config;
		this.folderPath = folderPath;
	}

	public async init(path: string) {
		try {
			this.currentVars = {};
			this.loadConfigVars();
			await this.defineDefaultVars(path);
			if (await this.prepareNeededVars()) {
				let uris = this.moveFiles(path);
				await this.runCmds();
				for (let uri of uris) {
					FilesManager.getInstance().onCreatedUri(uri);
				}
				this.openFiles();
			}

		} catch (e) {
			console.log(e);
		}
	}
	private loadConfigVars() {
		if (!this.configVars) {
			this.configVars = [];
			let configTxt = JSON.stringify(this.config);
			const regex = /\$\{\{(.*?)\}\}/gm;
			let match: RegExpExecArray | null;
			while ((match = regex.exec(configTxt)) !== null) {
				if (!this.configVars.includes(match[1])) {
					this.configVars.push(match[1]);
				}
			}
		}
	}
	private async defineDefaultVars(path: string) {
		let folderSplitted = path.split(sep);
		this.setVar('folderName', folderSplitted[folderSplitted.length - 1]);
		this.setVar('path', path);
		const projectInfo = this.getProjectInfo(path);
		this.setVar('namespace', projectInfo.namespace);
		this.setVar('module', projectInfo.module);
	}
	private getProjectInfo(path: string) {
		let result = {
			"namespace": "",
			"module": "",
		}
		let uri: string = pathToUri(path);
		let builds = ProjectManager.getInstance().getMatchingBuildsByUri(uri);
		if (builds.length > 0) {
			result.namespace = builds[0].getNamespaceForUri(uri, false);
			result.module = builds[0].project.getConfig()?.module ?? "";
		}
		return result;
	}
	private async prepareNeededVars() {
		for (let variableName in this.currentConfig.variables) {
			let currentVar = this.currentConfig.variables[variableName];
			if (currentVar.type == "input") {
				let defaultValue = currentVar.defaultValue ?? '';
				
				const resultInput = await GenericServer.Input({
					title: currentVar.question,
					value: defaultValue,
					validations: currentVar.validation?.map(p => { return { regex: p.pattern, message: p.errorMsg ?? 'Error' } })
				})

				if (!resultInput) {
					return false;
				}
				this.setVar(variableName, resultInput);
			}
			// else if (currentVar.type == "choice") {
			// 	let quickPicks: QuickPickItem[] = [];
			// 	for (let item in currentVar.list) {
			// 		quickPicks.push({
			// 			label: item,
			// 			detail: currentVar.list[item]
			// 		});
			// 	}
			// 	const resultData = await window.showQuickPick(quickPicks, {
			// 		placeHolder: currentVar.question,
			// 		canPickMany: false,
			// 	});
			// 	if (!resultData) {
			// 		return false;
			// 	}
			// 	this.setVar(variableName, resultData.label);
			// }
		}

		return true;
	}
	private moveFiles(path: string) {
		let filesToOpen: string[] = [];
		let configFiles: { [path: string]: string } = {};
		let filesUri: string[] = []
		const _internalLoop = (currentPath) => {
			let files = readdirSync(currentPath);
			for (let file of files) {
				let templatePath = currentPath + sep + file;
				let exportPath = templatePath.replace(this.folderPath, path);
				for (let varName in this.currentVars) {
					const regex = new RegExp('\\$\\{\\{' + varName + '\\}\\}', 'gm');
					exportPath = exportPath.replace(regex, this.currentVars[varName]);
				}
				exportPath = normalize(exportPath);
				if (statSync(templatePath).isDirectory() && file != '.git') {
					mkdirSync(exportPath);
					_internalLoop(templatePath);
				}
				else {
					if (templatePath == this.folderPath + sep + "template.avt") {
						continue;
					}
					let ctx = readFileSync(templatePath, 'utf-8');
					for (let varName in this.currentVars) {
						const regex = new RegExp('\\$\\{\\{' + varName + '\\}\\}', 'gm');
						ctx = ctx.replace(regex, this.currentVars[varName]);
					}

					if (this.currentConfig.filesToOpen) {
						for (let fileToOpenQuery of this.currentConfig.filesToOpen) {
							if (this.comparePath(exportPath, fileToOpenQuery)) {
								filesToOpen.push(exportPath);
							}
						}
					}
					if (file != "aventus.conf.avt") {
						writeFileSync(exportPath, ctx);
						if (exportPath.endsWith(".avt")) {
							filesUri.push(pathToUri(exportPath));
						}
					}
					else {
						configFiles[exportPath] = ctx;
					}
				}
			}
		}

		_internalLoop(this.folderPath);

		// Force config to be written at the end
		for (let configPath in configFiles) {
			writeFileSync(configPath, configFiles[configPath]);
			filesUri.push(pathToUri(configPath));
		}

		this.filesToOpen = filesToOpen;
		return filesUri;
	}

	private openFiles() {
		for (let path of this.filesToOpen) {
			GenericServer.sendNotification("aventus/openfile", pathToFileURL(path).toString());
		}
	}

	private comparePath(path: string, query: string) {
		let pathsToTest: string[] = [path];
		let workspacePath = uriToPath(GenericServer.getWorkspaceUri());
		let localPath = "." + path.replace(workspacePath, "").replace(/\\/g, "/")
		pathsToTest.push(localPath);

		if (query.match(/\/\S+\/g?m?s?i?x?s?u?/g)) {
			let splitted = query.split("/");
			let reg = new RegExp(splitted[1], splitted[2]);
			for (let pathToTest of pathsToTest) {
				if (pathToTest.match(reg)) {
					return true;
				}
			}
		}
		else {
			if (normalize(path) == normalize(query)) {
				return true;
			}

			if (pathsToTest.length > 1 && normalize(pathsToTest[1]) == normalize(query)) {
				return true;
			}
		}
		return false;
	}

	private setVar(name: string, value: string) {
		if (!this.currentVars[name]) {
			this.currentVars[name] = value;
			if (this.configVars?.includes(name)) {
				const regex = new RegExp('\\$\\{\\{' + name + '\\}\\}', 'gm');
				let safeValue = JSON.stringify(value).slice(1, -1); // prevent \\ and remove "" added by stringify
				let txt = JSON.stringify(this.currentConfig).replace(regex, safeValue);
				this.currentConfig = JSON.parse(txt);
			}
		}
	}

	private runCmds() {
		return new Promise<void>((resolve) => {
			setTimeout(() => {
				let params: ExecSyncOptionsWithBufferEncoding = {};
				params.cwd = uriToPath(GenericServer.getWorkspaceUri());
				if (this.currentConfig.cmdsAfter) {
					for (let cmd of this.currentConfig.cmdsAfter) {
						try {
							execSync(cmd, params)
						} catch (e) {
							console.log(e);
							GenericServer.showErrorMessage("The command " + cmd + " failed");
						}
					}
				}
				resolve();
			}, 500)
		})
	}
}