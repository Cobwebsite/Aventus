import { CodeAction } from 'vscode-css-languageservice';
import { CodeLens, Color, ColorInformation, ColorPresentation, CompletionItem, CompletionList, Definition, ExecuteCommandParams, FormattingOptions, Hover, Location, Position, PublishDiagnosticsParams, Range, TextEdit, WorkspaceEdit, WorkspaceFolder } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

export interface IConnection {
	open();
	delayBetweenBuild(): number;
	sendNotification(cmd: string, params: any): void;
	showErrorMessage(msg: string): void;
	sendDiagnostics(params: PublishDiagnosticsParams): void;

	onInitialize(cb: (params: AvInitializeParams) => void);
	onInitialized(cb: () => Promise<void>);
	onShutdown(cb: () => Promise<void>);
	getSettings(): Promise<any>;

	onCompletion(cb: (document: TextDocument | undefined, position: Position) => Promise<CompletionList | null>);
	onCompletionResolve(cb: (document: TextDocument | undefined, completionItem: CompletionItem) => Promise<CompletionItem>);
	onHover(cb: (document: TextDocument | undefined, position: Position) => Promise<Hover | null>);
	onDefinition(cb: (document: TextDocument | undefined, position: Position) => Promise<Definition | null>);
	onDocumentFormatting(cb: (document: TextDocument | undefined, options: FormattingOptions) => Promise<TextEdit[] | null>);
	onCodeAction(cb: (document: TextDocument | undefined, range: Range) => Promise<CodeAction[] | null>);
	onCodeLens(cb: (document: TextDocument | undefined) => Promise<CodeLens[] | null>);
	onReferences(cb: (document: TextDocument | undefined, position: Position) => Promise<Location[] | null>);
	onRenameRequest(cb: (document: TextDocument | undefined, position: Position, newName: string) => Promise<WorkspaceEdit | null>);
	onDocumentColor(cb: (document: TextDocument | undefined) => Promise<ColorInformation[] | null>);
	onColorPresentation(cb: (document: TextDocument | undefined, range: Range, color: Color) => Promise<ColorPresentation[] | null>);
	onExecuteCommand(cb: (params: ExecuteCommandParams) => void): void;
	onDidChangeConfiguration(cb: () => void): void;
	setFsPath(cb: (path: string) => void): void;
}





export interface AvInitializeParams {
	workspaceFolders: WorkspaceFolder[] | null;
}