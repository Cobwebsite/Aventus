import { Color, CompletionItem, ExecuteCommandParams, FormattingOptions, Position, PublishDiagnosticsParams, Range } from 'vscode-languageserver';
import { AvInitializeParams, IConnection, InputOptions, SelectItem, SelectOptions } from './IConnection';
import { FilesManager } from './files/FilesManager';
import { FilesWatcher } from './files/FilesWatcher';
import { ProjectManager } from './project/ProjectManager';
import { Settings, SettingsManager } from './settings/Settings';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusExtension } from './definition';
import { ColorPicker } from './color-picker/ColorPicker';
import { Commands } from './cmds';
import { join } from 'path';
import { LocalTemplateManager } from './files/LocalTemplate';
import { TemplateManager as TemplateFileManager } from './files/TemplateManager';
import { TemplateFileManager as TemplateFileTsManager } from './language-services/ts/template/TemplateFileManager';
import { CSharpManager } from './language-services/json/CSharpManager';
import { Build } from './project/Build';
import { Communication } from './communication';
import { PhpManager } from './language-services/json/PhpManager';
import { LocalProjectManager } from './files/LocalProject';
import { version } from '../../package.json'
import { existsSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { updatesScripts } from './updates';


export class GenericServer {
	private static instance: GenericServer;

	public static delayBetweenBuild() {
		return this.instance.connection.delayBetweenBuild();
	}
	public static isDebug() {
		return this.instance.isDebug;
	}
	public static get isIDE() {
		return this.instance.isIDE;
	}

	public static sendNotification(cmd: string, ...params: any) {
		this.instance.connection.sendNotification(cmd, params);
	}
	public static showErrorMessage(msg: string) {
		this.instance.connection.showErrorMessage(msg);
	}
	public static showWarningMessage(msg: string) {
		this.instance.connection.showWarningMessage(msg);
	}
	public static showInformationMessage(msg: string) {
		this.instance.connection.showInformationMessage(msg);
	}
	public static sendDiagnostics(params: PublishDiagnosticsParams, build?: Build) {
		this.instance.connection.sendDiagnostics(params, build?.buildConfig.name);
	}
	public static Input(options: InputOptions) {
		return this.instance.connection.Input(options);
	}
	public static Select(items: SelectItem[], options: SelectOptions) {
		return this.instance.connection.Select(items, options);
	}
	public static SelectMultiple(items: SelectItem[], options: SelectOptions) {
		return this.instance.connection.SelectMultiple(items, options);
	}
	public static SelectFolder(text: string, path: string) {
		return this.instance.connection.SelectFolder(text, path);
	}
	public static Popup(text: string, ...choices: string[]) {
		return this.instance.connection.Popup(text, ...choices);
	}
	public static setSettings(settings: Partial<Settings>, global: boolean) {
		return this.instance.connection.setSettings(settings, global);
	}
	public static get savePath(): string {
		return this.instance._savePath;
	}
	public static get extensionPath(): string {
		return this.instance._extensionPath;
	}
	public static getWorkspaceUri() {
		return this.instance.workspaces[0] ?? ''
	}
	public static get templateManager() {
		return this.instance._template;
	}
	public static get localTemplateManager() {
		return this.instance._localTemplate;
	}
	public static get localProjectManager() {
		return this.instance._localProject;
	}
	public static refreshSettings() {
		return this.instance.loadSettings();
	}


	protected connection: IConnection;
	protected isLoading: boolean = true;
	protected isDown: boolean = false;
	protected workspaces: string[] = [];
	protected isDebug = false;
	private isIDE = false;

	private _savePath: string = "";
	private _extensionPath: string = "";
	private _template: TemplateFileManager | undefined;
	private _localTemplate: LocalTemplateManager | undefined;
	private _localProject: LocalProjectManager | undefined;

	public constructor(connection: IConnection) {
		this.connection = connection;
		this.bindEvent();
	}


	public start() {
		GenericServer.instance = this;
		this.connection.open();
	}
	protected bindEvent() {
		this.connection.onInitialize((params: AvInitializeParams) => {
			this.onInitialize(params);
		})
		this.connection.onInitialized(async () => {
			await this.onInitialized();
		})
		this.connection.onShutdown(async () => {
			await this.onShutdown();
		})
		this.connection.onCompletion(async (document, position) => {
			return await this.onCompletion(document, position);
		})
		this.connection.onCompletionResolve(async (document, completionItem) => {
			return await this.onCompletionResolve(document, completionItem);
		})
		this.connection.onHover(async (document, position) => {
			return await this.onHover(document, position);
		})
		this.connection.onDefinition(async (document, position) => {
			return await this.onDefinition(document, position);
		})
		this.connection.onDocumentFormatting(async (document, options) => {
			return await this.onDocumentFormatting(document, options);
		})
		this.connection.onCodeAction(async (document, range) => {
			return await this.onCodeAction(document, range);
		})
		this.connection.onCodeLens(async (document) => {
			return await this.onCodeLens(document);
		})
		this.connection.onReferences(async (document, position) => {
			return await this.onReferences(document, position);
		})
		this.connection.onRenameRequest(async (document, position, newName) => {
			return await this.onRenameRequest(document, position, newName);
		})
		this.connection.onDocumentColor(async (document) => {
			return await this.onDocumentColor(document);
		})
		this.connection.onColorPresentation(async (document, range, color) => {
			return await this.onColorPresentation(document, range, color);
		})
		this.connection.onExecuteCommand(async (params) => {
			return await this.onExecuteCommand(params);
		})
		this.connection.onDidChangeConfiguration(async () => {
			return await this.onDidChangeConfiguration();
		})
		this.connection.onRequest(async (method, params) => {
			return await Communication.execute(method, params);
		})
	}

	protected onInitialize(params: AvInitializeParams) {
		if (params.workspaceFolders) {
			for (let workspaceFolder of params.workspaceFolders) {
				this.workspaces.push(workspaceFolder.uri);
			}
		}
		if (!params.savePath) {
			let appData = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
			params.savePath = join(appData, "aventus");
		}
		this.isIDE = params.isIDE;
		this._savePath = params.savePath;
		this._extensionPath = params.extensionPath;
		this.runUpdate();
	}
	protected async onInitialized() {
		if(!this.checkNodeJs()) return;
		await this.loadSettings();
		await this.startServer();
	}
	protected async onShutdown() {
		this.isDown = true;
		const settings = SettingsManager.getInstance().settings;
		if (!settings.onlyBuild) {
			await FilesWatcher.getInstance().destroy();
			CSharpManager.getInstance().destroy();
			PhpManager.getInstance().destroy();
		}
		ProjectManager.getInstance().destroyAll();
		await FilesManager.getInstance().onShutdown();
	}
	protected async onCompletion(document: TextDocument | undefined, position: Position) {
		if (this.isAllowed(document)) {
			return await FilesManager.getInstance().onCompletion(document, position);
		}
		return null;
	}
	protected async onCompletionResolve(document: TextDocument | undefined, completionItem: CompletionItem) {
		if (this.isAllowed(document)) {
			return await FilesManager.getInstance().onCompletionResolve(document, completionItem);
		}
		return completionItem;
	}
	protected async onHover(document: TextDocument | undefined, position: Position) {
		if (this.isAllowed(document)) {
			return await FilesManager.getInstance().onHover(document, position);
		}
		return null;
	}
	protected async onDefinition(document: TextDocument | undefined, position: Position) {
		if (this.isAllowed(document)) {
			return await FilesManager.getInstance().onDefinition(document, position);
		}
		return null;
	}
	protected async onDocumentFormatting(document: TextDocument | undefined, options: FormattingOptions) {
		if (this.isAllowed(document)) {
			return await FilesManager.getInstance().onFormatting(document, options);
		}
		return null;
	}
	protected async onCodeAction(document: TextDocument | undefined, range: Range) {
		if (this.isAllowed(document)) {
			return await FilesManager.getInstance().onCodeAction(document, range);
		}
		return null;
	}
	protected async onCodeLens(document: TextDocument | undefined) {
		if (this.isAllowed(document)) {
			return await FilesManager.getInstance().onCodeLens(document);
		}
		return null;
	}
	protected async onReferences(document: TextDocument | undefined, position: Position) {
		if (this.isAllowed(document)) {
			return await FilesManager.getInstance().onReferences(document, position);
		}
		return null;
	}
	protected async onRenameRequest(document: TextDocument | undefined, position: Position, newName: string) {
		if (this.isAllowed(document)) {
			return await FilesManager.getInstance().onRename(document, position, newName);
		}
		return null;
	}
	protected async onDocumentColor(document: TextDocument | undefined) {
		if (document && this.isStyleDocument(document)) {
			return ColorPicker.onDocumentColor(document);
		}
		return null;
	}
	protected async onColorPresentation(document: TextDocument | undefined, range: Range, color: Color) {
		if (document && this.isStyleDocument(document)) {
			return ColorPicker.onColorPresentations(document, range, color);
		}
		return null;
	}
	protected async onExecuteCommand(params: ExecuteCommandParams) {
		Commands.execute(params);
	}
	protected async onDidChangeConfiguration() {
		this.loadSettings();
	}


	public isAllowed(document?: TextDocument): document is TextDocument {
		if (!document) return false;
		return GenericServer.isAllowed(document);
	}
	public static isAllowed(document: TextDocument) {
		if (this.instance.isDown) return false;
		if (this.instance.isLoading) {
			return false;
		}
		if (document.uri.endsWith(AventusExtension.Base) || document.uri.endsWith(AventusExtension.Config) || document.uri.endsWith(AventusExtension.Template)) {
			return true;
		}
		return false;
	}
	protected isStyleDocument(document: TextDocument) {
		if (document.uri.endsWith(AventusExtension.ComponentStyle)) {
			return true;
		}
		if (document.uri.endsWith(AventusExtension.Component)) {
			return true;
		}
		if (document.uri.endsWith(AventusExtension.GlobalStyle)) {
			return true;
		}
		return false;
	}
	protected async loadSettings() {
		let result = await this.connection.getSettings();
		if (!result) {
			result = {};
		}
		SettingsManager.getInstance().initSettings(result);
		this.isDebug = SettingsManager.getInstance().settings.debug;

		let resultHtml = await this.connection.getSettingsHtml();
		if (!resultHtml) {
			resultHtml = {};
		}
		SettingsManager.getInstance().setSettingsHtml(resultHtml);
	}

	protected async startServer() {
		// define the config for startServer
		const settings = SettingsManager.getInstance().settings;
		if (!settings.onlyBuild) {
			this._template = new TemplateFileManager(this.workspaces);
			this._localTemplate = new LocalTemplateManager(this._template);
			this._localProject = new LocalProjectManager(this._template);
			CSharpManager.getInstance();
			PhpManager.getInstance();
		}

		ProjectManager.getInstance();
		TemplateFileTsManager.getInstance();
		if (settings.onlyBuild) {
			if (settings.configPath) {
				await FilesManager.getInstance().loadConfigFile(settings.configPath, settings.builds, settings.statics);
			}
			else
				await FilesManager.getInstance().loadConfigFileNotSet(this.workspaces, settings.builds, settings.statics);
		}
		else {
			await FilesManager.getInstance().loadAllAventusFiles(this.workspaces);
		}
		this.isLoading = false;
		if (this.isDebug) {
			console.log("start server done");
		}
	}

	protected runUpdate() {
		setTimeout(() => {

			const currentVersion = version;
			const oldVersion = SettingsManager.getInstance().hiddenSettings.version;
			if (currentVersion == oldVersion) return;
			if (!/([0-9]+)\.([0-9]+)\.([0-9]+)/g.test(currentVersion)) return;
			if (!/([0-9]+)\.([0-9]+)\.([0-9]+)/g.test(oldVersion)) return;


			const compareVersions = (v1: string, v2: string) => {
				const parts1 = v1.split('.').map(Number);
				const parts2 = v2.split('.').map(Number);

				const len = Math.max(parts1.length, parts2.length);
				for (let i = 0; i < len; i++) {
					const a = parts1[i] || 0;
					const b = parts2[i] || 0;
					if (a > b) return 1;
					if (a < b) return -1;
				}
				return 0;
			}

			const updates = updatesScripts
			for (let v in updates) {
				if (!/([0-9]+)\.([0-9]+)\.([0-9]+)/g.test(v)) continue;

				// if file version is bigger than old version
				if (compareVersions(v, oldVersion) == 1) {
					// if file version is egal or lower than current version
					if (compareVersions(v, currentVersion) != 1) {
						try {
							updates[v]();
						} catch (e) {
							console.error(e);
						}
					}
				}
			}

			SettingsManager.getInstance().setHiddenSettings({ version: currentVersion });
		}, 5000)

	}

	protected checkNodeJs() {
		const minVersion = '22.18.0';
		const isVersionGreaterOrEqual = (current: string, minimum: string) => {
			const cur = current.split('.').map(Number);
			const min = minimum.split('.').map(Number);
			for (let i = 0; i < 3; i++) {
				if (cur[i] > min[i]) return true;
				if (cur[i] < min[i]) return false;
			}
			return true;
		}

		const version = execSync("node -v").toString().trim();
		const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
		const currentVersion = version.startsWith("v") ? version.slice(1) : version;

		if (!match || !isVersionGreaterOrEqual(currentVersion, minVersion)) {
			GenericServer.showErrorMessage("To use Aventus, you need at least the nodejs version : " + minVersion);
			return false;
		}
		return true;
	}

}