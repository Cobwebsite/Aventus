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
		this.setVar('namespace', this.getNamespace(path));
	}
	private getNamespace(path: string) {
		let uri: string = pathToUri(path);
		let builds = ProjectManager.getInstance().getMatchingBuildsByUri(uri);
		if (builds.length > 0) {
			return builds[0].getNamespaceForUri(uri, false);
		}
		return "";
	}
	private async prepareNeededVars() {
		for (let variableName in this.currentConfig.variables) {
			let currentVar = this.currentConfig.variables[variableName];
			if (currentVar.type == "input") {
				let defaultValue = currentVar.defaultValue ?? '';
				let isValid: (value: string) => Promise<null | string> = async () => {
					return null;
				}
				if (currentVar.validation) {
					let validations: ((value: string) => string | null)[] = [];

					for (let validation of currentVar.validation) {
						if (!validation.errorMsg) {
							validation.errorMsg = "The value must match " + validation.pattern;
						}
						let pattern = validation.pattern;
						let error = validation.errorMsg;

						validations.push((value: string) => {
							if (!value.match(new RegExp(pattern))) {
								return error;
							}
							return null;
						})
					}

					isValid = async (value: string) => {
						for (let validation of validations) {
							let tempResult = validation(value);
							if (tempResult !== null) {
								return tempResult;
							}
						}
						return null;
					}
				}
				const resultInput = await GenericServer.Input({
					title: currentVar.question,
					value: defaultValue,
					validateInput: isValid,
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
				if (statSync(templatePath).isDirectory()) {
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

export class TemplateManager {
	private templatePath: string;
	private projectPath: string;

	private loadedTemplates: Template[] = [];
	private loadedProjects: Template[] = [];

	public getGeneralTemplates() {
		return this.loadedTemplates;
	}

	public constructor() {
		let storagePath = GenericServer.savePath;
		// if (existsSync(storageUri.fsPath)) {
		// 	rmSync(storageUri.fsPath, { recursive: true, force: true })
		// }
		if (!existsSync(storagePath)) {
			mkdirSync(storagePath);
		}
		this.templatePath = storagePath + sep + "templates";
		this.projectPath = storagePath + sep + "projects";
		if (!existsSync(this.templatePath)) {
			mkdirSync(this.templatePath);
		}
		if (!existsSync(this.projectPath)) {
			mkdirSync(this.projectPath);
			this.askTemplate();
		}
		this.loadedTemplates = this.readTemplates(this.templatePath);
		this.loadedProjects = this.readTemplates(this.projectPath);
	}

	public loadTemplates() {
		let storagePath = GenericServer.savePath;
		if (!existsSync(storagePath)) {
			mkdirSync(storagePath);
		}
		this.templatePath = storagePath + sep + "templates";
		this.projectPath = storagePath + sep + "projects";
		if (!existsSync(this.templatePath)) {
			mkdirSync(this.templatePath);
		}
		if (!existsSync(this.projectPath)) {
			mkdirSync(this.projectPath);
			this.askTemplate();
		}
		this.loadedTemplates = this.readTemplates(this.templatePath);
		this.loadedProjects = this.readTemplates(this.projectPath);
	}

	public async createProject(path: string) {
		let quickPicksTemplate: Map<SelectItem, Template> = new Map();
		if (this.loadedProjects.length == 0) {
			let result = await GenericServer.Popup("You have no template!! Do you want to load some?", 'Yes', 'No');
			if (result == 'Yes') {
				this.selectTemplateToImport();
			}
			return;
		}
		for (let template of this.loadedProjects) {
			let quickPick: SelectItem = {
				label: template.config.name,
				detail: template.config.description ?? "",
			}
			quickPicksTemplate.set(quickPick, template);
		}
		const resultFormat = await GenericServer.Select(Array.from(quickPicksTemplate.keys()), {
			placeHolder: 'Choose a template',
		});

		if (resultFormat) {
			let resultPick = this.getSelectItem(quickPicksTemplate, resultFormat);
			if (resultPick) {
				await resultPick.init(path);
			}
		}
	}

	public readTemplates(pathToRead: string) {
		let templates: Template[] = [];

		const readRecu = (currentFolder) => {
			let templateFolders = readdirSync(currentFolder);
			for (let templateFolder of templateFolders) {
				try {
					let folder = join(currentFolder, templateFolder);
					if (statSync(folder).isDirectory()) {
						let configPath = join(folder, "template.avt");
						if (existsSync(configPath)) {
							try {
								let config = JSON.parse(readFileSync(configPath, 'utf-8'));

								let template = new Template(config, folder);
								templates.push(template);
							} catch { }
						}
						else {
							readRecu(folder);
						}
					}
				} catch (e) {
					console.log(e);
				}
			}
		}
		if (existsSync(pathToRead)) {
			readRecu(pathToRead);
		}

		return templates;
	}

	private async askTemplate() {
		// let result = await window.showInformationMessage('Do you want to install project templates (recommended)', 'Yes', 'No');
		// if (result == 'Yes') {
		this.selectTemplateToImport();
		// }
	}
	public async selectTemplateToImport() {
		let projectsFolder = GenericServer.extensionPath + sep + "projects";
		let folders = readdirSync(projectsFolder);
		let quickPicks: Map<SelectItem, string> = new Map<SelectItem, string>();
		for (let folder of folders) {
			let folderPath = projectsFolder + sep + folder;
			if (statSync(folderPath).isDirectory()) {
				let confPath = folderPath + sep + 'template.avt';
				if (existsSync(confPath)) {
					try {
						let config = JSON.parse(readFileSync(confPath, 'utf-8'));
						let quickPick: SelectItem = {
							label: config.name,
							detail: config.description ?? "",
							picked: true,
						}
						quickPicks.set(quickPick, folderPath);
					} catch { }
				}
			}
		}

		let result = await GenericServer.SelectMultiple(Array.from(quickPicks.keys()), {
			title: "Select templates to import",
		});
		if (result) {
			for (let item of result) {
				let path = this.getSelectItem(quickPicks, item);
				if (path) {
					let folderName = path.split(sep).pop();
					let destPath = this.projectPath + sep + folderName;
					if (existsSync(destPath)) {
						rmSync(destPath, { recursive: true, force: true })
					}
					cpSync(path, destPath, { force: true, recursive: true })
				}
			}
			this.loadedProjects = this.readTemplates(this.projectPath);
		}

	}


	private getSelectItem<T>(map: Map<SelectItem, T>, item: SelectItem) {
		for (let key of map.keys()) {
			if (key.label == item.label) {
				return map.get(key) as T;
			}
		}
		return null;
	}
}

