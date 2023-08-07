import { CodeAction } from 'vscode-css-languageservice';
import { PublishDiagnosticsParams, Position, CompletionList, CompletionItem, Hover, Definition, FormattingOptions, TextEdit, Range, CodeLens, Location, WorkspaceEdit, ColorInformation, Color, ColorPresentation, ExecuteCommandParams } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AvInitializeParams, IConnection } from '../../server/src/IConnection';
import { Notifications } from './notification';

export class CliConnection implements IConnection {

	public constructor() {

	}
	open() {
		
	}
	delayBetweenBuild(): number {
		return 0;
	}
	sendNotification(cmd: string, params: any): void {
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
			console.log("[error] : " + diagnostic.message + " on "+params.uri+":"+diagnostic.range.start.line);
		}
	}
	onInitialize(cb: (params: AvInitializeParams) => void) {
		console.log("Aventus starting");
	}
	onInitialized(cb: () => Promise<void>) {
		console.log("Aventus started");
	}
	onShutdown(cb: () => Promise<void>) {
		console.log("Aventus stopped");
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