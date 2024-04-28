import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'fs';
import { GenericServer } from '../GenericServer';
import { join, normalize, sep } from 'path';
import { SelectItem } from '../IConnection';
import { Template } from './Template';
import { SettingsManager } from '../settings/Settings';

export class TemplateManager {
	private templatePath: string[] = [];
	private projectPath: string[] = [];

	private loadedTemplates: Template[] = [];
	private loadedProjects: Template[] = [];

	public getGeneralTemplates() {
		return this.loadedTemplates;
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

		this.loadedTemplates = this.readTemplates(this.templatePath);
		this.loadedProjects = this.readTemplates(this.projectPath);
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

	public readTemplates(pathToRead: string[]) {
		let templates: Template[] = [];

		const readRecu = (currentFolder: string) => {
			let configPath = join(currentFolder, "template.avt");
			if (existsSync(configPath)) {
				try {
					let config = JSON.parse(readFileSync(configPath, 'utf-8'));

					let template = new Template(config, currentFolder);
					templates.push(template);
				} catch {
					GenericServer.showErrorMessage("Error when parsing file " + configPath);
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

				if (path && this.projectPath.length > 0) {
					let folderName = path.split(sep).pop();
					let destPath = this.projectPath[0] + sep + folderName;
					if (existsSync(destPath)) {
						rmSync(destPath, { recursive: true, force: true })
					}
					cpSync(path, destPath, { force: true, recursive: true })
				}
			}
			this.loadedProjects = this.readTemplates(this.projectPath);
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
}
