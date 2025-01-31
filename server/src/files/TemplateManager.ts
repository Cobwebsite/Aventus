import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs';
import { GenericServer } from '../GenericServer';
import { join, normalize, sep } from 'path';
import { SelectItem } from '../IConnection';
import { TemplateJSON, TemplateScript } from './Template';
import { SettingsManager } from '../settings/Settings';
import { pathToUri, setValueToObject } from '../tools';
import { BaseTemplate } from './Templates/BaseTemplate';
import { BaseTemplateList } from './Templates';
import { execSync, spawn } from 'child_process';


export type TemplatesByName = { [name: string]: TemplateJSON | TemplateScript | BaseTemplate | TemplatesByName }

export class TemplateManager {
	private templatePath: string[] = [];
	private projectPath: string[] = [];

	private loadedTemplates: TemplatesByName = {};
	private loadedProjects: TemplatesByName = {};
	private loadedProjectsLength: number = 0;
	private loadedTemplatesLength: number = 0;
	// private templatesByName: {[]}

	public getGeneralTemplates() {
		return this.loadedTemplates;
	}
	public getGeneralTemplatesLength() {
		return this.loadedTemplatesLength;
	}

	public constructor() {
		this.loadTemplates();
		SettingsManager.getInstance().onSettingsChange(() => {
			this.loadTemplates();
		})
		this.validateEmptyFolder();
	}

	public loadTemplates() {
		let storagePath = GenericServer.savePath;
		if (!existsSync(storagePath)) {
			mkdirSync(storagePath);
		}
		this.templatePath = SettingsManager.getInstance().settings.templatePath;
		let basicTemplate = normalize(storagePath + sep + "templates");
		this.prepareFolders(this.templatePath, basicTemplate);

		this.projectPath = SettingsManager.getInstance().settings.projectPath;
		let basicProject = normalize(storagePath + sep + "projects");
		let needAsk = !existsSync(basicProject);
		this.prepareFolders(this.projectPath, basicProject);
		if (needAsk) {
			this.askTemplate();
		}

		this.reloadTemplates();
		this.reloadProjects();
	}

	private reloadTemplates() {
		const baseTemplateTemp = this.readBaseTemplates();
		const templateTemp = this.readTemplates(this.templatePath, baseTemplateTemp.templates, baseTemplateTemp.nb);
		this.loadedTemplates = templateTemp.templates;
		this.loadedTemplatesLength = templateTemp.nb;
	}
	private reloadProjects() {
		const projectsTemp = this.readTemplates(this.projectPath);
		this.loadedProjects = projectsTemp.templates;
		this.loadedProjectsLength = projectsTemp.nb;
	}
	private prepareFolders(variable: string[], _default: string) {
		if (!variable.includes(_default)) {
			variable.splice(0, 0, _default);
		}
		for (let i = 0; i < variable.length; i++) {
			variable[i] = normalize(variable[i]);
			if (!existsSync(variable[i])) {
				mkdirSync(variable[i]);
			}
		}
	}

	public async createProject(path: string) {
		if (this.loadedProjectsLength == 0) {
			let result = await GenericServer.Popup("You have no template for project! Do you want to load some?", 'Yes', 'No');
			if (result == 'Yes') {
				this.selectTemplateToImport();
			}
			return;
		}
		const templateResult = await this.query(this.loadedProjects);
		if (templateResult) {
			await templateResult.init(path)
		}
	}

	public readBaseTemplates() {
		const templates: TemplatesByName = {};
		if (SettingsManager.getInstance().settings.useDefaultTemplate) {
			for (let key in BaseTemplateList) {
				let template = new BaseTemplateList[key]();
				setValueToObject(template.name(), templates, template);
			}
		}
		return {
			templates,
			nb: Object.keys(BaseTemplateList).length
		};
	}
	public readTemplates(pathToRead: string[], templates: TemplatesByName = {}, nb: number = 0) {

		const readRecu = (currentFolder: string) => {
			let configPath = join(currentFolder, "template.avt");
			if (existsSync(configPath)) {
				try {
					let config = JSON.parse(readFileSync(configPath, 'utf-8'));

					let template = new TemplateJSON(config, currentFolder);
					setValueToObject(template.config.name, templates, template);
					nb++;
				} catch {
					GenericServer.showErrorMessage("Error when parsing file " + configPath);
				}
				return;
			}
			let configPathScript = join(currentFolder, "template.avt.ts");
			if (existsSync(configPathScript)) {
				try {

					let template = TemplateScript.create(configPathScript, currentFolder);
					setValueToObject(template.name, templates, template);
					nb++;

				} catch (e) {
					console.error(e);
					GenericServer.showErrorMessage("Error when parsing file " + configPathScript);
				}
				return;
			}
			let templateFolders = readdirSync(currentFolder);
			for (let templateFolder of templateFolders) {
				try {
					let folder = join(currentFolder, templateFolder);
					if (statSync(folder).isDirectory()) {
						readRecu(folder);
					}
				} catch (e) {
					console.log(e);
				}
			}
		}
		for (let path of pathToRead) {
			if (existsSync(path)) {
				readRecu(path);
			}
		}

		return {
			templates,
			nb
		};
	}
	private async getGitURL() {
		return await GenericServer.Input({
			title: "Git url",
			validations: [{
				message: "Provide an http(s):// url ending with .git",
				regex: "^https?:\\\/\/\\S*\\.git$"
			}]
		})
	}
	private async askTemplate() {
		// let result = await window.showInformationMessage('Do you want to install project templates (recommended)', 'Yes', 'No');
		// if (result == 'Yes') {
		this.selectProjectToImport(true);
		// }
	}
	public async selectProjectToImport(picked: boolean) {
		if (this.projectPath.length == 0) {
			GenericServer.showErrorMessage("No project path registered");
			return;
		}
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
							picked: picked,
						}
						quickPicks.set(quickPick, folderPath);
					} catch { }
				}
			}
		}
		quickPicks.set({
			label: "Git",
			detail: "Provide an http(s) url ending with .git",
		}, "@Git")

		let result = await GenericServer.SelectMultiple(Array.from(quickPicks.keys()), {
			title: "Select projects to import",
		});
		if (result) {
			for (let item of result) {
				let path = this.getSelectItem(quickPicks, item);

				if (path == "@Git") {
					const uri = await this.getGitURL();
					if (uri) {
						execSync("git clone " + uri, {
							cwd: this.projectPath[0]
						})
					}
				}
				else if (path) {
					let folderName = path.split(sep).pop();
					let destPath = this.projectPath[0] + sep + folderName;
					if (existsSync(destPath)) {
						rmSync(destPath, { recursive: true, force: true })
					}
					cpSync(path, destPath, { force: true, recursive: true })
				}
			}

			this.reloadProjects();
		}
	}

	public async selectTemplateToImport() {
		if (this.templatePath.length == 0) {
			GenericServer.showErrorMessage("No template path registered");
			return;
		}

		let quickPicks: SelectItem[] = [];
		quickPicks.push({
			label: "Git",
			detail: "Provide an http url ending with .git",
		});
		let result = await GenericServer.Select(quickPicks, {
			title: "Select templates to import",
		});
		if (result) {
			if (result.label == "Git") {
				const uri = await this.getGitURL();
				if (uri) {
					execSync("git clone " + uri, {
						cwd: this.templatePath[0]
					})
					this.reloadTemplates();
				}
			}
		}
	}

	public validateEmptyFolder() {
		let projectsFolder = GenericServer.extensionPath + sep + "projects";

		const checkOrCreate = (path: string | string[]) => {
			try {
				if (Array.isArray(path)) {
					path = path.join(sep);
				}
				if (!existsSync(path)) {
					mkdirSync(path)
				}
			} catch (e) { }
		}

		checkOrCreate([projectsFolder, "Default"]);
		checkOrCreate([projectsFolder, "Default", "src"]);
		checkOrCreate([projectsFolder, "Default", "src", "components"]);
		checkOrCreate([projectsFolder, "Default", "src", "data"]);
		checkOrCreate([projectsFolder, "Default", "src", "lib"]);
		checkOrCreate([projectsFolder, "Default", "src", "ram"]);
		checkOrCreate([projectsFolder, "Default", "src", "states"]);
		checkOrCreate([projectsFolder, "Default", "src", "static"]);

		checkOrCreate([projectsFolder, "Empty"]);
		checkOrCreate([projectsFolder, "Empty", "src"]);
	}


	private getSelectItem<T>(map: Map<SelectItem, T>, item: SelectItem) {
		for (let key of map.keys()) {
			if (key.label == item.label) {
				return map.get(key) as T;
			}
		}
		return null;
	}

	public async query(templates: TemplatesByName): Promise<TemplateJSON | TemplateScript | BaseTemplate | null> {
		let quickPicksTemplateByName: Map<SelectItem, TemplatesByName> = new Map();
		let quickPicksTemplate: Map<SelectItem, TemplateJSON | TemplateScript> = new Map();
		let quickPicksBaseTemplate: Map<SelectItem, BaseTemplate> = new Map();
		const quickPicks: SelectItem[] = [];
		for (let name in templates) {
			const current = templates[name];
			let quickPick: SelectItem;
			if (current instanceof TemplateJSON) {
				quickPick = {
					label: name,
					detail: current.config.description ?? "",
				}
				quickPicksTemplate.set(quickPick, current);
			}
			else if (current instanceof TemplateScript) {
				quickPick = {
					label: name,
					detail: current.description ?? "",
				}
				quickPicksTemplate.set(quickPick, current);
			}
			else if (current instanceof BaseTemplate) {
				quickPick = {
					label: name,
					detail: current.definition(),
				}
				quickPicksBaseTemplate.set(quickPick, current);
			}
			else {
				quickPick = {
					label: name,
				}
				quickPicksTemplateByName.set(quickPick, current);
			}
			quickPicks.push(quickPick);
		}
		const resultFormat = await GenericServer.Select(quickPicks, {
			placeHolder: 'Choose a template',
		});

		if (resultFormat) {
			let resultPick = this.getSelectItem(quickPicksTemplate, resultFormat);
			if (resultPick) {
				return resultPick
			}

			let resultPick2 = this.getSelectItem(quickPicksBaseTemplate, resultFormat);
			if (resultPick2) {
				return resultPick2;
			}

			let resultPick3 = this.getSelectItem(quickPicksTemplateByName, resultFormat);
			if (resultPick3) {
				return this.query(resultPick3);
			}
		}
		return null;
	}
}
