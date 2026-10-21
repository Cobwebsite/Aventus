import { cpSync, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'fs';
import { GenericServer } from '../GenericServer';
import { dirname, isAbsolute, join, normalize, posix, relative, resolve, sep, win32 } from 'path';
import { SelectItem } from '../IConnection';
import { TemplateScript } from './Template';
import { SettingsManager } from '../settings/Settings';
import { execAsync, getValueFromObject, setValueToObject, unlinkSync, uriToPath } from '../tools';
import { AventusExtension } from '../definition';
import { get } from 'http';
import { get as gets } from 'https';
import { pipeline } from 'stream';
import { Open } from 'unzipper'
import { Store } from '../store/Store';


export type TemplatesByName = { [name: string]: TemplateScript | TemplatesByName }

export class NoTemplatesAvailableError extends Error {}

function copyTemplateTree(templates: TemplatesByName): TemplatesByName {
	const copy: TemplatesByName = {};
	for (const [name, value] of Object.entries(templates)) {
		copy[name] = value instanceof TemplateScript || typeof value !== 'object' || value === null
			? value : copyTemplateTree(value);
	}
	return copy;
}

export class TemplateManager {
	public static getInstallationPath(root: string, folder: string): string | null {
		if (!folder || /^[\\/]/.test(folder) || win32.isAbsolute(folder) || /^[A-Za-z]:/.test(folder)) {
			return null;
		}
		const destination = resolve(root, folder.replace(/[\\/]/g, sep));
		const pathFromRoot = relative(resolve(root), destination);
		if (!pathFromRoot || pathFromRoot === '..' || pathFromRoot.startsWith('..' + sep)) {
			return null;
		}
		return destination;
	}


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
		const windowsPath = /^[A-Za-z]:[\\/]|^\\\\/.test(currentFolder);
		const pathTools = windowsPath ? win32 : currentFolder.startsWith("/") ? posix : { resolve, relative, isAbsolute, sep };
		const folder = pathTools.resolve(currentFolder);
		let selected = "";
		let selectedLength = -1;
		for (let workspace of this.workspaces) {
			if (/^[A-Za-z]:[\\/]|^\\\\/.test(workspace) !== windowsPath) continue;
			const root = pathTools.resolve(workspace);
			const child = pathTools.relative(root, folder);
			if (child !== ".." && !child.startsWith(".." + pathTools.sep) && !pathTools.isAbsolute(child) && root.length > selectedLength) {
				selected = workspace;
				selectedLength = root.length;
			}
		}
		if (selected) return selected;
		GenericServer.showErrorMessage("Can't load the workspace");
		return "";
	}


	public async readTemplates(pathToRead: string[], templates: TemplatesByName = {}, nb: number = 0) {
		templates = copyTemplateTree(templates);
		const promises: Promise<void>[] = []
		const readRecu = (currentFolder: string) => {
			let configPathScript = join(currentFolder, AventusExtension.Template);
			if (existsSync(configPathScript)) {
				try {
					promises.push(new Promise(async (resolve) => {
						let template = await TemplateScript.create(configPathScript);
						if (template) {
							const alreadyExisting = getValueFromObject(template.name, templates) as TemplateScript | undefined;
							if (alreadyExisting != undefined && alreadyExisting.folderPath != template.folderPath) {
								GenericServer.showErrorMessage("You have 2 templates with the same names : " + alreadyExisting?.folderPath + " and " + template.folderPath);
								resolve();
								return;
							}
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
		], { title: "Select a source from where to import projects" });

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
									detail: [template.description, folder].filter(Boolean).join(' - '),
									picked: picked,
									id: folderPath,
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
				let installed = false;
				for (let item of result) {
					let path = this.getSelectItem(quickPicks, item);
					if (path) {
						const folderName = scripts[path].installationFolder ?? path.split(sep).pop()!;
						const destPath = TemplateManager.getInstallationPath(this.projectPath[0], folderName);
						if (!destPath) {
							GenericServer.showErrorMessage("Invalid installation folder");
							continue;
						}
						if (existsSync(destPath)) {
							rmSync(destPath, { recursive: true, force: true })
						}
						cpSync(path, destPath, { force: true, recursive: true })
						installed = true;
					}
				}
				if (installed) {
					GenericServer.showInformationMessage("Projects installed");
				}
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
		], { title: "Select a source from where to import templates" });

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
									detail: [template.description, folder].filter(Boolean).join(' - '),
									picked: false,
									id: folderPath,
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
				let installed = false;
				for (let item of result) {
					let path = this.getSelectItem(quickPicks, item);

					if (path) {
						const folderName = scripts[path].installationFolder ?? path.split(sep).pop()!;
						const destPath = TemplateManager.getInstallationPath(this.templatePath[0], folderName);
						if (!destPath) {
							GenericServer.showErrorMessage("Invalid installation folder");
							continue;
						}
						if (existsSync(destPath)) {
							rmSync(destPath, { recursive: true, force: true })
						}
						cpSync(path, destPath, { force: true, recursive: true })
						installed = true;
					}
				}
				if (installed) {
					GenericServer.showInformationMessage("Templates installed");
					await this.reloadTemplates();
				}
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
		], { title: "Select a source from where to import global templates" });

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
									detail: [template.description, folder].filter(Boolean).join(' - '),
									picked: picked,
									id: folderPath,
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
				let installed = false;
				for (let item of result) {
					let path = this.getSelectItem(quickPicks, item);
					if (path) {
						const folderName = scripts[path].installationFolder ?? path.split(sep).pop()!;
						const destPath = TemplateManager.getInstallationPath(this.globalPath[0], folderName);
						if (!destPath) {
							GenericServer.showErrorMessage("Invalid installation folder");
							continue;
						}
						if (existsSync(destPath)) {
							rmSync(destPath, { recursive: true, force: true })
						}
						cpSync(path, destPath, { force: true, recursive: true })
						installed = true;
					}
				}
				if (installed) {
					GenericServer.showInformationMessage("Global templates installed");
				}
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

		if (this.removeSelectedInstallations(result, quickPicks, templates, () => this.getGeneralProjects(), this.projectPath) > 0) {
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

		if (this.removeSelectedInstallations(result, quickPicks, templates, () => this.getGeneralTemplates(), this.templatePath) > 0) {
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

		if (this.removeSelectedInstallations(result, quickPicks, templates, () => this.getGeneralGlobal(), this.globalPath) > 0) {
			await this.reloadGlobal();
			GenericServer.showInformationMessage("Global templates deleted");
		}
	}

	private removeSelectedInstallations(result: SelectItem[], choices: SelectItem[], templates: TemplateScript[], currentTree: () => TemplatesByName, roots: string[]): number {
		let removed = 0;
		const selected = new Set<TemplateScript>();
		for (const item of result) {
			const index = choices.findIndex(choice => choice.label === item.label && choice.detail === item.detail);
			if (index < 0) continue;

			const template = templates[index];
			if (selected.has(template) || getValueFromObject(template.name, currentTree()) !== template) continue;

			const folderPath = resolve(dirname(template.config));
			const insideRoot = roots.some(root => {
				const relativePath = relative(resolve(root), folderPath);
				return relativePath !== '' && relativePath !== '..' && !relativePath.startsWith('..' + sep) && !isAbsolute(relativePath);
			});
			if (!insideRoot || !existsSync(template.config)) continue;

			selected.add(template);
			rmSync(folderPath, { recursive: true, force: true });
			removed++;
		}
		return removed;
	}

	private getSelectItem<T>(map: Map<SelectItem, T>, item: SelectItem) {
		if (map.has(item)) return map.get(item) as T;
		for (let key of map.keys()) {
			if (item.id ? key.id === item.id : key.label === item.label && key.detail === item.detail) {
				return map.get(key) as T;
			}
		}
		return null;
	}

	public async query(path: string, templates: TemplatesByName): Promise<TemplateScript | null>;
	public async query(path: string, templates: TemplatesByName, quickPicks: SelectItem[]): Promise<TemplateScript | null | SelectItem>;
	public async query(path: string, templates: TemplatesByName, quickPicks?: SelectItem[]): Promise<TemplateScript | null | SelectItem> {
		const workspace = this.findWorkspace(path);
		const filterAllowed = async (items: TemplatesByName): Promise<TemplatesByName> => {
			const allowed: TemplatesByName = {};
			for (const [name, item] of Object.entries(items)) {
				if (item instanceof TemplateScript) {
					if (await item.isAllowed(path, workspace)) allowed[name] = item;
				} else {
					const children = await filterAllowed(item);
					if (Object.keys(children).length > 0) allowed[name] = children;
				}
			}
			return allowed;
		};
		const allowedTemplates = await filterAllowed(templates);
		if (Object.keys(allowedTemplates).length === 0) {
			throw new NoTemplatesAvailableError('No templates available for this location');
		}
		return this.queryAllowed(allowedTemplates, quickPicks);
	}

	private async queryAllowed(templates: TemplatesByName, quickPicks?: SelectItem[]): Promise<TemplateScript | null | SelectItem> {
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
		if (quickPicks.length === 0) {
			return null;
		}
		const resultFormat = await GenericServer.Select(quickPicks, {
			title: 'What do you want to create?',
		});

		if (resultFormat) {
			let resultPick = this.getSelectItem(quickPicksTemplate, resultFormat);
			if (resultPick) {
				return resultPick
			}

			let resultPick3 = this.getSelectItem(quickPicksTemplateByName, resultFormat);
			if (resultPick3) {
				return this.queryAllowed(resultPick3);
			}

			if (hasCustom) {
				return resultFormat;
			}
		}
		return null;
	}

	public async downloadTemplateFromStore(uri?: string) {
		let packageTempPath: string | undefined;
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

			packageTempPath = join(GenericServer.savePath, "temp", "packageTemp");
			rmSync(packageTempPath, { recursive: true, force: true });
			mkdirSync(packageTempPath, { recursive: true });
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

				const folderName = temp.installationFolder ?? packageName;
				const destPath = TemplateManager.getInstallationPath(writeBasePath, folderName);
				if (!destPath) {
					GenericServer.showErrorMessage("Invalid installation folder");
					return;
				}
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
			}
			else {
				GenericServer.showErrorMessage(AventusExtension.Template + " not found");
			}

		} catch (e) {
			GenericServer.showErrorMessage("Error unknown");
			console.error(e)
		} finally {
			if (packageTempPath) {
				rmSync(packageTempPath, { recursive: true, force: true });
			}
		}
	}


	private downloadFile(fileUri: string, httpUri: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			try {
				let fct = httpUri.startsWith("https") ? gets : get
				const request = fct(httpUri, (response) => {
					if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
						response.resume();
						resolve(false);
						return;
					}
					pipeline(response, createWriteStream(fileUri), (error) => {
						if (error && existsSync(fileUri)) unlinkSync(fileUri);
						resolve(!error);
					});
				});
				request.on('error', () => resolve(false));
			} catch (e) {
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
