import { cpSync, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { GenericServer } from '../GenericServer';
import { dirname, join, normalize, sep } from 'path';
import { SelectItem } from '../IConnection';
import { TemplateScript } from './Template';
import { SettingsManager } from '../settings/Settings';
import { execAsync, setValueToObject, uriToPath } from '../tools';
import { AventusExtension } from '../definition';
import { get } from 'http';
import { get as gets } from 'https';
import { Open } from 'unzipper'
import { Store } from '../store/Store';


export type TemplatesByName = { [name: string]: TemplateScript | TemplatesByName }

export class TemplateManager {
	private templatePath: string[] = [];
	private projectPath: string[] = [];
	private globalPath: string[] = [];

	private loadedTemplates: TemplatesByName = {};
	private loadedProjects: TemplatesByName = {};
	private loadedGlobal: TemplatesByName = {};
	private loadedProjectsLength: number = 0;
	private loadedTemplatesLength: number = 0;
	private loadedGlobalLength: number = 0;
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
	public getGeneralGlobal() {
		return this.loadedGlobal;
	}
	public getGeneralGlobalLength() {
		return this.loadedGlobalLength;
	}

	public constructor(workspaces: string[]) {
		this.workspaces = workspaces.map(p => uriToPath(p).replace(/\//g, sep));

		// this.validateEmptyFolder();
	}

	public async init() {
		if (GenericServer.isIDE) {
			this.loadTemplates(); // dont lock if is IDE
		}
		else {
			await this.loadTemplates();
		}
		SettingsManager.getInstance().onSettingsChange(() => {
			this.loadTemplates();
		})
	}

	public async loadTemplates() {
		let storagePath = GenericServer.savePath;
		if (!existsSync(storagePath)) {
			mkdirSync(storagePath);
		}
		this.templatePath = SettingsManager.getInstance().settings.templatePath;
		let basicTemplate = normalize(storagePath + sep + "templates");
		this.prepareFolders(this.templatePath, basicTemplate);

		this.globalPath = SettingsManager.getInstance().settings.globalPath;
		let basicGlobal = normalize(storagePath + sep + "global");
		this.prepareFolders(this.globalPath, basicGlobal);

		this.projectPath = SettingsManager.getInstance().settings.projectPath;
		let basicProject = normalize(storagePath + sep + "projects");
		let needAsk = !existsSync(basicProject) || readdirSync(basicProject).length == 0;
		this.prepareFolders(this.projectPath, basicProject);
		if (needAsk) {
			await this.askTemplate();
		}

		const promises: Promise<void>[] = []
		promises.push(this.reloadTemplates());
		promises.push(this.reloadProjects());
		promises.push(this.reloadGlobal());
		await Promise.all(promises);
	}

	private async reloadTemplates() {
		const templateTemp = await this.readTemplates(this.templatePath);
		this.loadedTemplates = templateTemp.templates;
		this.loadedTemplatesLength = templateTemp.nb;
	}
	private async reloadProjects() {
		const projectsTemp = await this.readTemplates(this.projectPath);
		this.loadedProjects = projectsTemp.templates;
		this.loadedProjectsLength = projectsTemp.nb;
	}
	private async reloadGlobal() {
		const globalTemp = await this.readTemplates(this.globalPath);
		this.loadedGlobal = globalTemp.templates;
		this.loadedGlobalLength = globalTemp.nb;
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


	public async readTemplates(pathToRead: string[], templates: TemplatesByName = {}, nb: number = 0) {
		const promises: Promise<void>[] = []
		const readRecu = (currentFolder: string) => {
			let configPathScript = join(currentFolder, AventusExtension.Template);
			if (existsSync(configPathScript)) {
				try {
					promises.push(new Promise(async (resolve) => {
						let template = await TemplateScript.create(configPathScript);
						if (template) {
							setValueToObject(template.name, templates, template);
							nb++;
						}
						resolve();
					}))

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
					GenericServer.error(e);
				}
			}
		}
		for (let path of pathToRead) {
			if (existsSync(path)) {
				readRecu(path);
			}
		}

		await Promise.all(promises);

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
		let result = await GenericServer.ask('Do you want to install project templates (recommended)?');
		if (result) {
			await this.selectProjectToImport(true);
		}
	}
	public async selectProjectToImport(picked: boolean) {
		if (this.projectPath.length == 0) {
			GenericServer.showErrorMessage("No project path registered");
			return;
		}

		const sourceResult = await GenericServer.Select([
			{ label: "Local" },
			// { label: "Store" },
			{ label: "Git" },
		], { placeHolder: "Select a source from where to import projects" });

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
							const template = await TemplateScript.create(confPath);
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
				GenericServer.showInformationMessage("Projects installed");
			}
		}
		else if (sourceResult.label == "Git") {
			const uri = await this.getGitURL();
			if (uri) {
				await execAsync("git clone " + uri, {
					cwd: this.projectPath[0]
				})
			}
		}
		else if (sourceResult.label == "Store") {
			await this.downloadTemplateFromStore();
		}

		await this.reloadProjects();


	}

	public async selectTemplateToImport() {
		if (this.templatePath.length == 0) {
			GenericServer.showErrorMessage("No template path registered");
			return;
		}

		const sourceResult = await GenericServer.Select([
			{ label: "Local" },
			// { label: "Store" },
			{ label: "Git" },
		], { placeHolder: "Select a source from where to import templates" });

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

			for (let folder of folders) {
				let folderPath = projectsFolder + sep + folder;
				if (statSync(folderPath).isDirectory()) {
					let confPath = folderPath + sep + AventusExtension.Template;
					if (existsSync(confPath)) {
						try {
							const template = await TemplateScript.create(confPath);
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
				GenericServer.showInformationMessage("Templates installed");
				await this.reloadTemplates();
			}
		}
		else if (sourceResult.label == "Git") {
			const uri = await this.getGitURL();
			if (uri) {
				await execAsync("git clone " + uri, {
					cwd: this.templatePath[0]
				})
			}
			await this.reloadTemplates();
		}
		else if (sourceResult.label == "Store") {
			await this.downloadTemplateFromStore();
		}

	}
	public async selectGlobalToImport(picked: boolean) {
		if (this.globalPath.length == 0) {
			GenericServer.showErrorMessage("No global template path registered");
			return;
		}

		const sourceResult = await GenericServer.Select([
			{ label: "Local" },
			// { label: "Store" },
			{ label: "Git" },
		], { placeHolder: "Select a source from where to import global templates" });

		if (!sourceResult) {
			return
		}

		if (sourceResult.label == "Local") {
			let globalFolder = GenericServer.extensionPath + sep + "templates" + sep + "global";
			let folders = readdirSync(globalFolder);
			let quickPicks: Map<SelectItem, string> = new Map<SelectItem, string>();
			const scripts: { [name: string]: TemplateScript } = {};
			for (let folder of folders) {
				let folderPath = globalFolder + sep + folder;
				if (statSync(folderPath).isDirectory()) {
					let confPath = folderPath + sep + AventusExtension.Template;
					if (existsSync(confPath)) {
						try {
							const template = await TemplateScript.create(confPath);
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
				title: "Select global templates to import",
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
						let destPath = this.globalPath[0] + folderName;
						if (existsSync(destPath)) {
							rmSync(destPath, { recursive: true, force: true })
						}
						cpSync(path, destPath, { force: true, recursive: true })
					}
				}
				GenericServer.showInformationMessage("Global templates installed");
			}
		}
		else if (sourceResult.label == "Git") {
			const uri = await this.getGitURL();
			if (uri) {
				await execAsync("git clone " + uri, {
					cwd: this.globalPath[0]
				})
			}
		}
		else if (sourceResult.label == "Store") {
			await this.downloadTemplateFromStore();
		}

		await this.reloadGlobal();


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
			await this.reloadProjects();
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
			await this.reloadTemplates();
			GenericServer.showInformationMessage("Templates deleted");
		}
	}

	public async selectGlobalToUninstall() {
		const globalTree = this.getGeneralGlobal();
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
		parse(globalTree);

		const result = await GenericServer.SelectMultiple(quickPicks, { title: "Select global templates to remove" })
		if (!result) return;

		for (let item of result) {
			if (item.detail) {
				let folderPath = dirname(item.detail);
				rmSync(folderPath, { recursive: true, force: true })
			}
		}

		if (result.length > 0) {
			await this.reloadGlobal();
			GenericServer.showInformationMessage("Global templates deleted");
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

	public async query(path: string, templates: TemplatesByName): Promise<TemplateScript | null>;
	public async query(path: string, templates: TemplatesByName, quickPicks: SelectItem[]): Promise<TemplateScript | null | SelectItem>;
	public async query(path: string, templates: TemplatesByName, quickPicks?: SelectItem[]): Promise<TemplateScript | null | SelectItem> {
		let hasCustom = true;
		if (!quickPicks) {
			hasCustom = false;
			quickPicks = [];
		}
		let quickPicksTemplateByName: Map<SelectItem, TemplatesByName> = new Map();
		let quickPicksTemplate: Map<SelectItem, TemplateScript> = new Map();
		for (let name in templates) {
			const current = templates[name];
			let quickPick: SelectItem;
			if (current instanceof TemplateScript) {

				if (!await current.isAllowed(path, this.findWorkspace(path))) continue;

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
		quickPicks.sort((a, b) => a.label.localeCompare(b.label));
		const resultFormat = await GenericServer.Select(quickPicks, {
			placeHolder: 'What do you want to create?',
		});

		if (resultFormat) {
			let resultPick = this.getSelectItem(quickPicksTemplate, resultFormat);
			if (resultPick) {
				return resultPick
			}

			let resultPick3 = this.getSelectItem(quickPicksTemplateByName, resultFormat);
			if (resultPick3) {
				return this.query(path, resultPick3);
			}

			if (hasCustom) {
				return resultFormat;
			}
		}
		return null;
	}

	public async downloadTemplateFromStore(uri?: string) {
		try {
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
			if (!match) {
				GenericServer.showErrorMessage("The uri provided is wrong");
				return;
			}

			const packageName = match[1];
			const packageVersion = match[2];

			const packageTempPath = join(GenericServer.savePath, "temp", "packageTemp");
			if (!existsSync(packageTempPath)) {
				mkdirSync(packageTempPath, { recursive: true })
			}
			let downloadPath = join(packageTempPath, "temp.zip");
			if (!await this.downloadFile(downloadPath, uri)) {
				GenericServer.showErrorMessage("Error downloading package");
				return;
			}
			if (!await this.extractZip(downloadPath, packageTempPath)) {
				GenericServer.showErrorMessage("Error extracting package to analyze");
				return;
			}

			if (existsSync(join(packageTempPath, AventusExtension.Template))) {

				const temp = await TemplateScript.create(join(packageTempPath, AventusExtension.Template));
				if (!temp) {
					GenericServer.showErrorMessage("The template contains error");
					return;
				}

				const writeBasePath = temp.isGlobal ? this.globalPath[0] : temp.isProject ? this.projectPath[0] : this.templatePath[0];

				let folderName = temp.installationFolder ?? packageName;
				folderName = folderName.replace(/\//g, sep).replace(/\\/, sep);
				if (!folderName.startsWith(sep)) {
					folderName = sep + folderName;
				}
				let destPath = writeBasePath + folderName;
				if (!await this.extractZip(downloadPath, destPath)) {
					GenericServer.showErrorMessage("Error extracting package");
					return;
				}

				if (temp.isGlobal) {
					await this.reloadGlobal();
				}
				else if (temp.isProject) {
					await this.reloadProjects();
				}
				else {
					await this.reloadTemplates();
				}
				GenericServer.showInformationMessage("Template " + packageName + " installed");
				rmSync(packageTempPath, { force: true, recursive: true });
			}
			else {
				GenericServer.showErrorMessage(AventusExtension.Template + " not found");
			}

		} catch (e) {
			GenericServer.showErrorMessage("Error unknown");
			console.error(e)
		}
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
	private async extractZip(zipPath: string, outputDir: string) {
		try {
			const directory = await Open.file(zipPath);
			await directory.extract({ path: outputDir })
			return true;
		} catch (e) {
			console.error("Extract error ", e)
		}
		return false;
	}

	public async readGlobal() {
		let global = this.getGeneralGlobal();
		let globalLength = this.getGeneralGlobalLength();
		let uri = GenericServer.getWorkspaceUri()
		if (uri) {
			let aventusFolder = uriToPath(uri) + '/.aventus/global';
			return await this.readTemplates([aventusFolder], global, globalLength);
		}
		return {
			templates: global,
			nb: globalLength
		};
	}
}
