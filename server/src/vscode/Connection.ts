import { createConnection, ProposedFeatures, PublishDiagnosticsParams, _, _Connection, CompletionList, Definition, FormattingOptions, Hover, Position, TextEdit, InitializeParams, TextDocumentSyncKind, CodeActionKind, TextDocuments, CodeLens, Color, ColorInformation, ColorPresentation, ExecuteCommandParams, Range, WorkspaceEdit, Location } from 'vscode-languageserver/node';
import { AvInitializeParams, IConnection, InputOptions, SelectItem, SelectOptions } from '../IConnection';
import { Commands } from '../cmds';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CodeAction, CompletionItem } from 'vscode-css-languageservice';
import { GenericServer } from '../GenericServer';
import { AskInput } from '../notification/AskInput';
import { AskSelect } from '../notification/AskSelect';
import { AskSelectMultiple } from '../notification/AskSelectMultiple';
import { Popup } from '../notification/Popup';
import { FilesManager } from '../files/FilesManager';
import { AventusLanguageId } from '../definition';
import { Settings, SettingsHtml } from '../settings/Settings';
import { SetSettings } from '../notification/SetSettings';

export class VsCodeConnection implements IConnection {

	private _connection: _Connection<_, _, _, _, _, _, _>;
	private documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

	public constructor() {
		this._connection = createConnection(ProposedFeatures.all);
		this.addDocumentsAction();
	}

	private addDocumentsAction() {
		this.documents.onDidChangeContent(async (e) => {
			if (GenericServer.isAllowed(e.document)) {
				FilesManager.getInstance().onContentChange(e.document);
			}
		});

		this.documents.onDidSave((e) => {
			if (GenericServer.isAllowed(e.document)) {
				FilesManager.getInstance().preventUpdateUri(e.document.uri);
				FilesManager.getInstance().onSave(e.document);
			}
		})
		this.documents.onDidClose(e => {
			if (GenericServer.isAllowed(e.document)) {
				FilesManager.getInstance().onClose(e.document);
			}
		});
	}

	public open() {
		// Make the text document manager listen on the connection
		// for open, change and close text document events
		this.documents.listen(this._connection);

		// Listen on the connection
		this._connection.listen();
	}
	public delayBetweenBuild() {
		return 300
	}
	public async getSettings(): Promise<Partial<Settings>> {
		return this._connection.workspace.getConfiguration({
			section: "aventus",
		})
	}
	public async setSettings(settings: Partial<Settings>, global: boolean): Promise<void> {
		await SetSettings.send(settings, global);
	}
	public async getSettingsHtml(): Promise<Partial<SettingsHtml>> {
		return this._connection.workspace.getConfiguration({
			section: "html",
		})
	}
	public sendNotification(cmd: string, params: any): void {
		this._connection.sendNotification(cmd, params);
	}
	public showErrorMessage(msg: string): void {
		this._connection.window.showErrorMessage(msg);
	}
	public showWarningMessage(msg: string): void {
		this._connection.window.showWarningMessage(msg);
	}
	public showInformationMessage(msg: string): void {
		this._connection.window.showInformationMessage(msg);
	}

	public sendDiagnostics(params: PublishDiagnosticsParams, build?: string): void {
		this._connection.sendDiagnostics(params)
	}
	public onInitialize(cb: (params: AvInitializeParams) => void) {

		this._connection.onInitialize((params: InitializeParams) => {
			cb({
				workspaceFolders: params.workspaceFolders ?? null,
				savePath: params.initializationOptions.savePath,
				extensionPath: params.initializationOptions.extensionPath,
				isIDE: true,
			})
			return {
				capabilities: {
					textDocumentSync: TextDocumentSyncKind.Incremental,
					// Tell the client that the server supports code completion
					completionProvider: {
						resolveProvider: true,
						// triggerCharacters: ['.'],
					},
					executeCommandProvider: {
						commands: Object.keys(Commands.allCommandes)
					},
					hoverProvider: {},
					definitionProvider: {},
					documentFormattingProvider: {},
					codeActionProvider: {
						codeActionKinds: [CodeActionKind.QuickFix],
						resolveProvider: true,
					},
					referencesProvider: {
					},
					codeLensProvider: {
						resolveProvider: true,
					},
					renameProvider: true,
					colorProvider: {
						documentSelector: [{ language: AventusLanguageId.SCSS }, { language: AventusLanguageId.WebComponent }]
					}
				}
			};
		})
	}

	public onInitialized(cb: () => Promise<void>) {
		this._connection.onInitialized(async () => {
			await cb();
		});
	}
	public onShutdown(cb: () => Promise<void>) {
		this._connection.onShutdown(async () => {
			await cb();
		});
	}
	public onCompletion(cb: (document: TextDocument | undefined, position: Position) => Promise<CompletionList | null>) {
		this._connection.onCompletion(async (params, token) => {
			const document = this.documents.get(params.textDocument.uri);
			return await cb(document, params.position);
		});
	}
	public onCompletionResolve(cb: (document: TextDocument | undefined, completionItem: CompletionItem) => Promise<CompletionItem>) {
		this._connection.onCompletionResolve(async (completionItem, token) => {
			if (completionItem.data?.uri) {
				const document = this.documents.get(completionItem.data.uri);
				return cb(document, completionItem);
			}
			return completionItem;
		});
	}
	public onHover(cb: (document: TextDocument | undefined, position: Position) => Promise<Hover | null>) {
		this._connection.onHover(async (params, token) => {
			const document = this.documents.get(params.textDocument.uri);
			return await cb(document, params.position);
		});
	}
	public onDefinition(cb: (document: TextDocument | undefined, position: Position) => Promise<Definition | null>) {
		this._connection.onDefinition(async (params, token) => {
			const document = this.documents.get(params.textDocument.uri);
			return await cb(document, params.position);
		});
	}
	public onDocumentFormatting(cb: (document: TextDocument | undefined, options: FormattingOptions) => Promise<TextEdit[] | null>) {
		this._connection.onDocumentFormatting(async (params, token) => {
			const document = this.documents.get(params.textDocument.uri);
			return await cb(document, params.options);
		});
	}

	public onCodeAction(cb: (document: TextDocument | undefined, range: Range) => Promise<CodeAction[] | null>) {
		this._connection.onCodeAction(async (params, token) => {
			const document = this.documents.get(params.textDocument.uri);
			return await cb(document, params.range);
		});
	}
	public onCodeLens(cb: (document: TextDocument | undefined) => Promise<CodeLens[] | null>) {
		this._connection.onCodeLens(async (params, token) => {
			const document = this.documents.get(params.textDocument.uri);
			return await cb(document);
		});
	}
	public onReferences(cb: (document: TextDocument | undefined, position: Position) => Promise<Location[] | null>) {
		this._connection.onReferences(async (params) => {
			const document = this.documents.get(params.textDocument.uri);
			return await cb(document, params.position);
		});
	}
	public onRenameRequest(cb: (document: TextDocument | undefined, position: Position, newName: string) => Promise<WorkspaceEdit | null>) {
		this._connection.onRenameRequest(async (params) => {
			const document = this.documents.get(params.textDocument.uri);
			return await cb(document, params.position, params.newName);
		});
	}
	public onDocumentColor(cb: (document: TextDocument | undefined) => Promise<ColorInformation[] | null>) {
		this._connection.onDocumentColor(async (params) => {
			const document = this.documents.get(params.textDocument.uri);
			return await cb(document);
		});
	}
	public onColorPresentation(cb: (document: TextDocument | undefined, range: Range, color: Color) => Promise<ColorPresentation[] | null>) {
		this._connection.onColorPresentation(async (params) => {
			const document = this.documents.get(params.textDocument.uri);
			return await cb(document, params.range, params.color);
		});
	}
	public onExecuteCommand(cb: (params: ExecuteCommandParams) => void): void {
		this._connection.onExecuteCommand(async (params) => {
			await cb(params);
		});
	}
	public onDidChangeConfiguration(cb: () => void) {
		this._connection.onDidChangeConfiguration(async (params) => {
			await cb();
		});
	}
	public onRequest(cb: (method: string, params: object | any[] | undefined) => Promise<any>) {
		this._connection.onRequest(async (channel, params) => {
			return await cb(channel, params);
		});
	}


	public async Input(options: InputOptions): Promise<string | null> {
		return await AskInput.send(options);
	}
	public async Select(items: SelectItem[], options: SelectOptions): Promise<SelectItem | null> {
		return await AskSelect.send(items, options);
	}
	public async SelectMultiple(items: SelectItem[], options: SelectOptions): Promise<SelectItem[] | null> {
		return await AskSelectMultiple.send(items, options);
	}
	public async Popup(text: string, ...choices: string[]): Promise<string | null> {
		return await Popup.send(text, ...choices);
	}
	public async SelectFolder(text: string, path: string): Promise<string | null> {
		return null
	}
}