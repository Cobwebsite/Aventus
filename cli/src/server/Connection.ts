import { CodeAction } from 'vscode-css-languageservice';
import { Diagnostic, PublishDiagnosticsParams, Position, CompletionList, CompletionItem, Hover, Definition, FormattingOptions, TextEdit, Range, CodeLens, Location, WorkspaceEdit, ColorInformation, Color, ColorPresentation, ExecuteCommandParams, DiagnosticSeverity } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AvInitializeParams, IConnection, InputOptions, SelectItem, SelectOptions } from '../../../server/src/IConnection';
import { Notifications } from './notification/index';
import { pathToUri } from '@server/tools'
import { dirname, join } from 'path';
import { RealServer } from './RealServer';
import { Settings } from '@server/settings/Settings';
import { ServerConfig } from './Server';

export type CliErrors = { [build: string]: CliErrorsBuild };
export type CliErrorsBuild = { [uri: string]: Diagnostic[] };

export class CliConnection implements IConnection {

	public errorsByBuildByFile: CliErrors = {};
	public cbErrors: ((errors: CliErrorsBuild, build: string) => void)[] = [];
	public _connection: FakeConnection;
	protected config: ServerConfig;
	public constructor(config: ServerConfig) {
		this._connection = new FakeConnection();
		this.config = config;
	}


	async open() {
		this._connection.open();
	}
	delayBetweenBuild(): number {
		return 0;
	}
	sendNotification(cmd: string, params: any[]): void {
		if (Notifications.allNotifications[cmd]) {
			let fct = Notifications.allNotifications[cmd].action as any;
			fct.call(Notifications.allNotifications[cmd], ...params);
		}
	}
	showErrorMessage(msg: string): void {
		console.log("[error] : " + msg);
	}
	showWarningMessage(msg: string): void {
		console.log("[warning] : " + msg);
	}
	showInformationMessage(msg: string): void {
		console.log("[info] : " + msg);
	}
	public subscribeErrors(cb: (errors: CliErrorsBuild, build: string) => void) {
		this.cbErrors.push(cb);
	}
	public unsubscribeErrors(cb: (errors: CliErrorsBuild, build: string) => void) {
		let index = this.cbErrors.indexOf(cb);
		if (index > -1) {
			this.cbErrors.splice(index, 1);
		}
	}
	public emitErrors() {
		for (let build in this.errorsByBuildByFile) {
			for (let cb of this.cbErrors) {
				cb(this.errorsByBuildByFile[build], build);
			}
		}
	}
	sendDiagnostics(params: PublishDiagnosticsParams, build?: string): void {
		const checkError = (errorsByFile: { [uri: string]: Diagnostic[] }) => {
			if (params.diagnostics && params.diagnostics.length > 0) {
				errorsByFile[params.uri] = params.diagnostics;
			}
			else if (errorsByFile[params.uri]) {
				delete errorsByFile[params.uri];
			}
		}
		if (build && this.config.errorByBuild) {
			if (!this.errorsByBuildByFile[build]) {
				this.errorsByBuildByFile[build] = {};
			}
			let errorsByFile = this.errorsByBuildByFile[build];
			checkError(errorsByFile);
		} else {
			if (!this.errorsByBuildByFile['']) {
				this.errorsByBuildByFile[''] = {};
			}
			checkError(this.errorsByBuildByFile[''])
		}
		this.emitErrors();
	}
	onInitialize(cb: (params: AvInitializeParams) => void) {
		let extensionPath = dirname(__dirname);
		if (__filename.endsWith("Connection.js")) {
			// dev
			extensionPath = dirname(dirname(dirname(__dirname)));
		}

		const params: AvInitializeParams = {
			extensionPath: extensionPath,
			isIDE: false,
			workspaceFolders: [{
				name: "",
				uri: pathToUri(process.cwd())
			}]
		}

		this._connection.onInitialize(() => {
			cb(params)
		})

	}
	onInitialized(cb: () => Promise<void>) {
		this._connection.onInitialized(() => {
			cb();
		})
	}
	onShutdown(cb: () => Promise<void>) {
		this._connection.onShutdown(() => {
			cb();
		})
	}
	async getSettings(): Promise<Partial<Settings>> {
		return {
			onlyBuild: this.config.onlyBuild,
			builds: this.config.builds,
			statics: this.config.statics,
			configPath: this.config.configPath,
			debug: this.config.debug,
			errorByBuild: this.config.errorByBuild,
			useStats: this.config.useStats
		};
	}
	async onCompletion(cb: (document: TextDocument | undefined, position: Position) => Promise<CompletionList | null>) {

	}
	async onCompletionResolve(cb: (document: TextDocument | undefined, completionItem: CompletionItem) => Promise<CompletionItem>) {
	}
	async onHover(cb: (document: TextDocument | undefined, position: Position) => Promise<Hover | null>) {
	}
	async onDefinition(cb: (document: TextDocument | undefined, position: Position) => Promise<Definition | null>) {
	}
	async onDocumentFormatting(cb: (document: TextDocument | undefined, options: FormattingOptions) => Promise<TextEdit[] | null>) {
	}
	async onCodeAction(cb: (document: TextDocument | undefined, range: Range) => Promise<CodeAction[] | null>) {
	}
	async onCodeLens(cb: (document: TextDocument | undefined) => Promise<CodeLens[] | null>) {
	}
	async onReferences(cb: (document: TextDocument | undefined, position: Position) => Promise<Location[] | null>) {
	}
	async onRenameRequest(cb: (document: TextDocument | undefined, position: Position, newName: string) => Promise<WorkspaceEdit | null>) {
	}
	async onDocumentColor(cb: (document: TextDocument | undefined) => Promise<ColorInformation[] | null>) {
	}
	async onColorPresentation(cb: (document: TextDocument | undefined, range: Range, color: Color) => Promise<ColorPresentation[] | null>) {
	}
	onExecuteCommand(cb: (params: ExecuteCommandParams) => void): void {
	}
	onDidChangeConfiguration(cb: () => void): void {
	}


	async Input(options: InputOptions): Promise<string | null> {
		if (options.validations) {
			let validations: ((value: string) => string | null)[] = [];
			if (options.validations) {
				const addValidation = (val: { regex: string, message: string }) => {
					validations.push((value: string) => {
						if (!value.match(new RegExp(val.regex))) {
							return val.message;
						}
						return null;
					})
				}
				for (let validation of options.validations) {
					addValidation(validation);
				}
			}
			let fct = async (value: string) => {
				for (let validation of validations) {
					let tempResult = validation(value);
					if (tempResult !== null) {
						return tempResult;
					}
				}
				return true;
			}
			return await RealServer.interaction.input(options.title, options.value, fct);
		}
		else {
			return await RealServer.interaction.input(options.title, options.value);
		}
	}
	async Select(items: SelectItem[], options: SelectOptions): Promise<SelectItem | null> {
		let title = "";
		if (options.title) {
			title += options.title;
		}
		if (options.placeHolder) {
			if (title != "") {
				title += " - ";
			}
			title += options.placeHolder;
		}
		let values: { value: string, name: string, checked?: boolean }[] = [];
		for (let item of items) {
			let detail = item.detail ? item.label + " - " + item.detail : item.label;
			values.push({
				value: item.label,
				name: detail,
				checked: item.picked ?? false
			})
		}

		let result = await RealServer.interaction.select(title, values);

		for (let item of items) {
			if (item.label == result) {
				return item;
			}
		}
		return null;
	}
	async SelectMultiple(items: SelectItem[], options: SelectOptions): Promise<SelectItem[] | null> {
		let title = "";
		if (options.title) {
			title += options.title;
		}
		if (options.placeHolder) {
			if (title != "") {
				title += " - ";
			}
			title += options.placeHolder;
		}
		let values: { value: string, name: string, checked: boolean }[] = [];
		for (let item of items) {
			let detail = item.detail ? item.label + " - " + item.detail : item.label;
			values.push({
				value: item.label,
				name: detail,
				checked: item.picked ?? false
			})
		}

		let results = await RealServer.interaction.selectMultiple(title, values);
		if (!results) {
			return null;
		}
		let ret: SelectItem[] = [];
		for (let result of results) {
			for (let item of items) {
				if (item.label == result) {
					ret.push(item);
				}
			}
		}
		return ret.length > 0 ? ret : null;
	}
	async Popup(text: string, ...choices: string[]): Promise<string | null> {
		if (choices.length > 0) {
			let values: { value: string, name: string, checked: boolean }[] = [];
			for (let choice of choices) {
				values.push({
					value: choice,
					name: choice,
					checked: false
				})
			}
			return await RealServer.interaction.select(text, values);
		}
		else {
			console.log(text);
			return null;
		}
	}
	public async SelectFolder(text: string, path: string): Promise<string | null> {
		return await RealServer.interaction.tree(text, path)
	}
}


export class FakeConnection {
	public open() {
		this.run(this.onInitializeCb);
		this.run(this.onInitializedCb);
	}

	private onInitializeCb: (() => void)[] = [];
	public onInitialize(cb: () => void) {
		this.onInitializeCb.push(cb);
	}

	private onInitializedCb: (() => void)[] = [];
	public onInitialized(cb: () => void) {
		this.onInitializedCb.push(cb);
	}

	public stop() {
		this.run(this.onShutdownCb);
	}
	private onShutdownCb: (() => void)[] = [];
	public onShutdown(cb: () => void) {
		this.onShutdownCb.push(cb);
	}


	private run(cbs: (() => void)[]) {
		for (let cb of cbs) {
			cb();
		}
	}
}