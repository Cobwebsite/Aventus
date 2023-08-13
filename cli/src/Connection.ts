import { CodeAction } from 'vscode-css-languageservice';
import { PublishDiagnosticsParams, Position, CompletionList, CompletionItem, Hover, Definition, FormattingOptions, TextEdit, Range, CodeLens, Location, WorkspaceEdit, ColorInformation, Color, ColorPresentation, ExecuteCommandParams } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AvInitializeParams, IConnection } from '../../server/src/IConnection';
import { Notifications } from './notification';
import { pathToUri } from '@server/tools'

export class CliConnection implements IConnection {

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
	sendNotification(cmd: string, ...params: any): void {
		if (Notifications.allNotifications[cmd]) {
			let fct = Notifications.allNotifications[cmd].action as any;
			fct.call(null, params);
		}
	}
	showErrorMessage(msg: string): void {
		console.log("[error] : " + msg);
	}
	sendDiagnostics(params: PublishDiagnosticsParams): void {
		for (let diagnostic of params.diagnostics) {
			console.log("[error] : " + diagnostic.message + " on " + params.uri + ":" + diagnostic.range.start.line);
		}
	}
	onInitialize(cb: (params: AvInitializeParams) => void) {
		this._connection.onInitialize(() => {
			cb({
				workspaceFolders: [{
					name: "",
					uri: pathToUri(process.cwd())
				}]
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
	setFsPath(cb: (path: string) => void): void {
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