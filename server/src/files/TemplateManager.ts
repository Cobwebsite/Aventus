import { cpSync, createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { GenericServer } from '../GenericServer';
import { dirname, join, normalize, sep } from 'path';
import { SelectItem } from '../IConnection';
import { TemplateScript } from './Template';
import { SettingsManager } from '../settings/Settings';
import { pathToUri, setValueToObject, uriToPath } from '../tools';
import { execSync, spawn } from 'child_process';
import { AventusExtension } from '../definition';
import { get } from 'http';
import { get as gets } from 'https';
import { Extract } from 'unzipper'
import { Store } from '../store/Store';


export type TemplatesByName = { [name: string]: TemplateScript | TemplatesByName }

export class TemplateManager {
	private templatePath: string[] = [];
	private projectPath: string[] = [];

	private loadedTemplates: TemplatesByName = {};
	private loadedProjects: TemplatesByName = {};
	private loadedProjectsLength: number = 0;
	private loadedTemplatesLength: number = 0;
	public workspaces: string[] = [];
	// private templatesByName: {[]}

	public getGeneralTemplates() {
		return this.loadedTemplates;
	}
	public getGeneralTemplatesLength() {
		return this.loadedTemplatesLength;
	}
	public getGeneralProjects() {
		return this.loadedProjects;
	}
	public getGeneralProjectsLength() {
		return this.loadedProjectsLength;
	}

	public constructor(workspaces: string[]) {
		this.workspaces = workspaces.map(p => uriToPath(p).replace(/\//g, sep));
		this.loadTemplates();
		SettingsManager.getInstance().onSettingsChange(() => {
			this.loadTemplates();
		})
		// this.validateEmptyFolder();
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
		const templateTemp = this.readTemplates(this.templatePath);
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
	public findWorkspace(currentFolder: string) {
		for (let workspace of this.workspaces) {
			if (currentFolder.startsWith(workspace)) {
				return workspace;
			}
		}
		GenericServer.showErrorMessage("Can't load the workspace");
		return "";
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
			await templateResult.init(path, this.findWorkspace(path))
		}
	}

	public readTemplates(pathToRead: string[], templates: TemplatesByName = {}, nb: number = 0) {

		const readRecu = (currentFolder: string) => {
			let configPathScript = join(currentFolder, AventusExtension.Template);
			if (existsSync(configPathScript)) {
				try {

					let template = TemplateScript.create(configPathScript);
					if (template) {
						setValueToObject(template.name, templates, template);
						nb++;
					}

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

		const sourceResult = await GenericServer.Select([
			{ label: "Local" },
			{ label: "Store" },
			{ label: "Git" },
		], { title: "Source" });

		if (!sourceResult) {
			return
		}

		if (sourceResult.label == "Local") {
			let projectsFolder = GenericServer.extensionPath + sep + "templates" + sep + "projects";
			let folders = readdirSync(projectsFolder);
			let quickPicks: Map<SelectItem, string> = new Map<SelectItem, string>();
			const scripts: { [name: string]: TemplateScript } = {};
			for (let folder of folders) {
				let folderPath = projectsFolder + sep + folder;
				if (statSync(folderPath).isDirectory()) {
					let confPath = folderPath + sep + AventusExtension.Template;
					if (existsSync(confPath)) {
						try {
							const template = TemplateScript.create(confPath);
							if (template) {
								scripts[folderPath] = template;
								let quickPick: SelectItem = {
									label: template.name,
									detail: template.description ?? "",
									picked: picked,
								}
								quickPicks.set(quickPick, folderPath);
							}
						} catch { }
					}
				}
			}
			let result = await GenericServer.SelectMultiple(Array.from(quickPicks.keys()), {
				title: "Select projects to import",
			});
			if (result) {
				for (let item of result) {
					let path = this.getSelectItem(quickPicks, item);
					if (path) {
						let folderName = scripts[path].installationFolder ?? path.split(sep).pop()!;
						folderName = folderName.replace(/\//g, sep).replace(/\\/, sep);
						if (!folderName.startsWith(sep)) {
							folderName = sep + folderName;
						}
						let destPath = this.projectPath[0] + folderName;
						if (existsSync(destPath)) {
							rmSync(destPath, { recursive: true, force: true })
						}
						cpSync(path, destPath, { force: true, recursive: true })
					}
				}
			}
		}
		else if (sourceResult.label == "Git") {
			const uri = await this.getGitURL();
			if (uri) {
				execSync("git clone " + uri, {
					cwd: this.projectPath[0]
				})
			}
		}
		else if (sourceResult.label == "Store") {
			await this.downloadTemplateFromStore();
		}

		this.reloadProjects();


	}

	public async selectTemplateToImport() {
		if (this.templatePath.length == 0) {
			GenericServer.showErrorMessage("No template path registered");
			return;
		}

		const sourceResult = await GenericServer.Select([
			{ label: "Local" },
			{ label: "Store" },
			{ label: "Git" },
		], { title: "Source" });

		if (!sourceResult) {
			return
		}

		if (sourceResult.label == "Local") {
			let projectsFolder = GenericServer.extensionPath + sep + "templates" + sep + "templates";
			let folders = readdirSync(projectsFolder);
			let quickPicks: Map<SelectItem, string> = new Map<SelectItem, string>();
			const scripts: { [name: string]: TemplateScript } = {};
			const wks = GenericServer.templateManager?.workspaces ?? [];
			if (wks.length == 0) return;
			let workspace = wks[0];

			for (let folder of folders) {
				let folderPath = projectsFolder + sep + folder;
				if (statSync(folderPath).isDirectory()) {
					let confPath = folderPath + sep + AventusExtension.Template;
					if (existsSync(confPath)) {
						try {
							const template = TemplateScript.create(confPath);
							if (template) {
								scripts[folderPath] = template;
								let quickPick: SelectItem = {
									label: template.name,
									detail: template.description ?? "",
									picked: false,
								}
								quickPicks.set(quickPick, folderPath);
							}
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
						let folderName = scripts[path].installationFolder ?? path.split(sep).pop()!;
						folderName = folderName.replace(/\//g, sep).replace(/\\/, sep);
						if (!folderName.startsWith(sep)) {
							folderName = sep + folderName;
						}
						let destPath = this.templatePath[0] + folderName;
						if (existsSync(destPath)) {
							rmSync(destPath, { recursive: true, force: true })
						}
						cpSync(path, destPath, { force: true, recursive: true })
					}
				}
			}
		}
		else if (sourceResult.label == "Git") {
			const uri = await this.getGitURL();
			if (uri) {
				execSync("git clone " + uri, {
					cwd: this.templatePath[0]
				})
			}
		}
		else if (sourceResult.label == "Store") {
			await this.downloadTemplateFromStore();
		}

		this.reloadTemplates();
	}

	public async selectProjectToUninstall() {
		const projectsTree = this.getGeneralProjects();
		const templates: TemplateScript[] = [];
		const quickPicks: SelectItem[] = [];

		const parse = (tree: TemplatesByName) => {
			for (let key in tree) {
				const el = tree[key];
				if (el instanceof TemplateScript) {
					templates.push(el);
					quickPicks.push({
						label: el.name,
						detail: el.config
					})
				}
				else {
					parse(el);
				}
			}
		}
		parse(projectsTree);

		const result = await GenericServer.SelectMultiple(quickPicks, { title: "Select projects to remove" })
		if (!result) return;

		for (let item of result) {
			if (item.detail) {
				let folderPath = dirname(item.detail);
				rmSync(folderPath, { recursive: true, force: true })
			}
		}

		if (result.length > 0) {
			GenericServer.showInformationMessage("Projects deleted");
		}
	}

	public async selectTemplateToUninstall() {
		const templatesTree = this.getGeneralTemplates();
		const templates: TemplateScript[] = [];
		const quickPicks: SelectItem[] = [];

		const parse = (tree: TemplatesByName) => {
			for (let key in tree) {
				const el = tree[key];
				if (el instanceof TemplateScript) {
					templates.push(el);
					quickPicks.push({
						label: el.name,
						detail: el.config
					})
				}
				else {
					parse(el);
				}
			}
		}
		parse(templatesTree);

		const result = await GenericServer.SelectMultiple(quickPicks, { title: "Select templates to remove" })
		if (!result) return;

		for (let item of result) {
			if (item.detail) {
				let folderPath = dirname(item.detail);
				rmSync(folderPath, { recursive: true, force: true })
			}
		}

		if (result.length > 0) {
			GenericServer.showInformationMessage("Templates deleted");
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

	public async query(templates: TemplatesByName): Promise<TemplateScript | null> {
		let quickPicksTemplateByName: Map<SelectItem, TemplatesByName> = new Map();
		let quickPicksTemplate: Map<SelectItem, TemplateScript> = new Map();
		const quickPicks: SelectItem[] = [];
		for (let name in templates) {
			const current = templates[name];
			let quickPick: SelectItem;
			if (current instanceof TemplateScript) {
				quickPick = {
					label: name,
					detail: current.description ?? "",
				}
				quickPicksTemplate.set(quickPick, current);
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

			let resultPick3 = this.getSelectItem(quickPicksTemplateByName, resultFormat);
			if (resultPick3) {
				return this.query(resultPick3);
			}
		}
		return null;
	}

	public async downloadTemplateFromStore(uri?: string) {
		const regex = `^${Store.url.replace(/\//g, '\\/')}\\/template\\/download\\/(?<name>[^/]+)\\/(?<version>\\d+\\.\\d+\\.\\d+)$`
		if (!uri) {
			const askUri = await GenericServer.Input({
				title: "Store url",
				validations: [{
					message: "The store url must be " + Store.url + "\/template\/download\/{name}\/{version}$",
					regex: regex
				}]
			})
			if (!askUri) return;
			uri = askUri;
		}
		const match = uri.match(new RegExp(regex));
		if (!match) return;

		const packageName = match[1];
		const packageVersion = match[2];

		const packageTempPath = join(GenericServer.savePath, "temp", "packageTemp");
		if (!existsSync(packageTempPath)) {
			mkdirSync(packageTempPath, { recursive: true })
		}
		let downloadPath = join(packageTempPath, "temp.zip");
		if (!await this.downloadFile(downloadPath, uri)) {
			return;
		}
		if (!await this.extractZip(downloadPath, packageTempPath)) {
			return;
		}

		if (existsSync(join(packageTempPath, AventusExtension.Template))) {

			const temp = TemplateScript.create(join(packageTempPath, AventusExtension.Template));
			if (!temp) {
				GenericServer.showErrorMessage("The template contains error");
				return;
			}

			const writeBasePath = temp.isProject ? this.projectPath[0] : this.templatePath[0];

			let folderName = temp.installationFolder ?? packageName;
			folderName = folderName.replace(/\//g, sep).replace(/\\/, sep);
			if (!folderName.startsWith(sep)) {
				folderName = sep + folderName;
			}
			let destPath = writeBasePath + folderName;
			if (!await this.extractZip(downloadPath, destPath)) {
				return;
			}

			GenericServer.showInformationMessage("Template " + packageName + " installed");
		}

		rmSync(packageTempPath, { force: true, recursive: true });
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
}
