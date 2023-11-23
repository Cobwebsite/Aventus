import { CodeAction } from 'vscode-css-languageservice';
import { PublishDiagnosticsParams, Position, CompletionList, CompletionItem, Hover, Definition, FormattingOptions, TextEdit, Range, CodeLens, Location, WorkspaceEdit, ColorInformation, Color, ColorPresentation, ExecuteCommandParams, DiagnosticSeverity } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AvInitializeParams, IConnection, InputOptions, SelectItem, SelectOptions } from '../../server/src/IConnection';
import { Notifications } from './notification/index';
import { pathToUri } from '@server/tools'
import { Interaction } from './Interaction';
import { dirname, join } from 'path';

export class CliConnection implements IConnection {

	public errorsByFile: { [uri: string]: string[] } = {};
	public cbErrors: ((errors: string[]) => void)[] = [];
	public _connection: FakeConnection;
	public constructor() {
		this._connection = new FakeConnection();
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
	public subscribeErrors(cb: (errors: string[]) => void) {
		this.cbErrors.push(cb);
	}
	public unsubscribeErrors(cb: (errors: string[]) => void) {
		let index = this.cbErrors.indexOf(cb);
		if (index > -1) {
			this.cbErrors.splice(index, 1);
		}
	}
	public emitErrors() {
		let result: string[] = [];
		for (let uri in this.errorsByFile) {
			for (let error of this.errorsByFile[uri]) {
				result.push(error);
			}
		}
		if (result.length == 0) {
			result.push("No error");
		}
		for (let cb of this.cbErrors) {
			cb(result);
		}
	}
	sendDiagnostics(params: PublishDiagnosticsParams): void {
		if (params.diagnostics && params.diagnostics.length > 0) {
			this.errorsByFile[params.uri] = [];
			for (let diagnostic of params.diagnostics) {
				let sev = "";
				if (diagnostic.severity == DiagnosticSeverity.Error) {
					sev = "\x1b[31m[error]\x1b[0m";
				}
				else if (diagnostic.severity == DiagnosticSeverity.Warning) {
					sev = "\x1b[33m[warning]\x1b[0m";
				}
				else if (diagnostic.severity == DiagnosticSeverity.Information) {
					sev = "\x1b[34m[info]\x1b[0m";
				}
				else if (diagnostic.severity == DiagnosticSeverity.Hint) {
					sev = "\x1b[90m[hint]\x1b[0m";
					continue;
				}
				this.errorsByFile[params.uri].push(sev + " : " + diagnostic.message + " on " + params.uri + ":" + (diagnostic.range.start.line + 1));
			}
		}
		else {
			if (this.errorsByFile[params.uri]) {
				delete this.errorsByFile[params.uri];
			}
		}
		this.emitErrors();
	}
	onInitialize(cb: (params: AvInitializeParams) => void) {
		let extensionPath = dirname(__dirname);
		if (extensionPath.endsWith("src")) {
			// dev
			extensionPath = dirname(dirname(__dirname));
		}
		this._connection.onInitialize(() => {
			cb({
				workspaceFolders: [{
					name: "",
					uri: pathToUri(process.cwd())
				}],
				extensionPath: extensionPath,
				isIDE: false
			})
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
	async getSettings(): Promise<any> {
		return {};
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
		if (options.validateInput) {
			let check = options.validateInput;
			let fct = async (value: string) => {
				let err = await check(value);
				if (!err) {
					return true;
				}
				return err;
			}
			return await Interaction.input(options.title, options.value, fct);
		}
		else {
			return await Interaction.input(options.title, options.value);
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

		let result = await Interaction.select(title, values);

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

		let results = await Interaction.selectMultiple(title, values);
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
			return await Interaction.select(text, values);
		}
		else {
			console.log(text);
			return null;
		}
	}
	public async SelectFolder(text: string, path: string): Promise<string | null> {
		return await Interaction.tree(text, path)
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