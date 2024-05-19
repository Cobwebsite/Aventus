import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'fs';
import { GenericServer } from '../GenericServer';
import { join, normalize, sep } from 'path';
import { SelectItem } from '../IConnection';
import { Template } from './Template';
import { SettingsManager } from '../settings/Settings';

type TemplateGroups = {
	projects: Template[],
	others: Template[]
}
export class TemplateManager {
	private templatePath: string[] = [];

	private templates: TemplateGroups = {
		projects: [],
		others: []
	};

	public getOthersTemplates() {
		return this.templates.others;
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
		let needAsk = !existsSync(basicTemplate);
		this.prepareFolders(this.templatePath, basicTemplate);

		if (needAsk) {
			this.askTemplate();
		}

		this.templates = this.readTemplates(this.templatePath);
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
		if (this.templates.projects.length == 0) {
			let result = await GenericServer.Popup("You have no template!! Do you want to load some?", 'Yes', 'No');
			if (result == 'Yes') {
				this.selectTemplateToImport();
			}
			return;
		}

		let root: any = {};

		for (let template of this.templates.projects) {
			let splitted = template.config.name.split(".");
			let current = root;
			for (let i = 0; i < splitted.length - 1; i++) {
				if (!current[splitted[i]]) {
					current[splitted[i]] = {};
				}
				current = current[splitted[i]]
			}
			if (!current['@children']) {
				current['@children'] = [];
			}
			current['@children'].push(template);
		}

		let result = await this.choosePath(root, root);
		if (result && result != 'back') {
			await result.init(path);
		}
	}

	private async choosePath(current: any, root: any): Promise<Template | null | 'back'> {
		if (!current) return null;
		let quickPicksTemplate: Map<SelectItem, Template> = new Map();
		let quickPicks: SelectItem[] = [];
		let backOption: SelectItem = {
			label: "Back",
		}
		if (current != root) {
			quickPicks.push(backOption);
		}
		for (let key in current) {
			if (key != "@children") {
				quickPicks.push({
					label: key,
				});
			}
		}
		if (current["@children"]) {
			for (let child of current["@children"]) {
				let template = child as Template;
				let quickPick: SelectItem = {
					label: template.config.name,
					detail: template.config.description ?? "",
				}
				quickPicksTemplate.set(quickPick, template);
			}
		}

		while (true) {
			const resultFormat = await GenericServer.Select(quickPicks, {
				placeHolder: 'Choose a template',
			});
			if (resultFormat) {
				let resultPick = quickPicksTemplate.get(resultFormat);
				if (resultPick) {
					return resultPick
				}
				else if (resultFormat == backOption) {
					return 'back';
				}
				else {
					const resultTemp = await this.choosePath(current[resultFormat.label], root);
					if (resultTemp != 'back') {
						return resultTemp;
					}
				}
			}
			else {
				return null;
			}
		}
	}

	public readTemplates(pathToRead: string[]): TemplateGroups {
		const templates: TemplateGroups = {
			projects: [],
			others: []
		};

		const readRecu = (currentFolder: string) => {
			let configPath = join(currentFolder, "template.avt");
			if (existsSync(configPath)) {
				try {
					let config = JSON.parse(readFileSync(configPath, 'utf-8'));

					let template = new Template(config, currentFolder);
					if (template.config.isProject) {
						templates.projects.push(template);
					}
					else {
						templates.others.push(template);
					}
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
		let projectsFolder = GenericServer.extensionPath + sep + "templates";
		let folders = readdirSync(projectsFolder);
		let quickPicks: Map<SelectItem, string> = new Map<SelectItem, string>();
		const loadRecu = (folders, currentPath) => {
			for (let folder of folders) {
				let folderPath = currentPath + sep + folder;
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
					else {
						loadRecu(readdirSync(folderPath), folderPath);
					}
				}
			}
		}
		loadRecu(folders, projectsFolder);

		let result = await GenericServer.SelectMultiple(Array.from(quickPicks.keys()), {
			title: "Select templates to import",
		});
		if (result) {
			for (let item of result) {
				let path = this.getSelectItem(quickPicks, item);

				if (path && this.templatePath.length > 0) {
					let destPath = path.replace(projectsFolder,  this.templatePath[0])
					if (existsSync(destPath)) {
						rmSync(destPath, { recursive: true, force: true })
					}
					cpSync(path, destPath, { force: true, recursive: true })
				}
			}
			this.templates = this.readTemplates(this.templatePath);
		}
	}

	public validateEmptyFolder() {
		let templatesFolder = GenericServer.extensionPath + sep + "templates";

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

		checkOrCreate([templatesFolder, "projects", "Default"]);
		checkOrCreate([templatesFolder, "projects", "Default", "src"]);
		checkOrCreate([templatesFolder, "projects", "Default", "src", "components"]);
		checkOrCreate([templatesFolder, "projects", "Default", "src", "data"]);
		checkOrCreate([templatesFolder, "projects", "Default", "src", "lib"]);
		checkOrCreate([templatesFolder, "projects", "Default", "src", "ram"]);
		checkOrCreate([templatesFolder, "projects", "Default", "src", "states"]);
		checkOrCreate([templatesFolder, "projects", "Default", "src", "static"]);

		checkOrCreate([templatesFolder, "projects", "Empty"]);
		checkOrCreate([templatesFolder, "projects", "Empty", "src"]);
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
