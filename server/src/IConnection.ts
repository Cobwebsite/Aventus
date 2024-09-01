import { CodeAction, CodeLens, Color, ColorInformation, ColorPresentation, CompletionItem, CompletionList, Definition, ExecuteCommandParams, FormattingOptions, Hover, Location, Position, PublishDiagnosticsParams, Range, TextEdit, WorkspaceEdit, WorkspaceFolder } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

export interface IConnection {
	open();
	delayBetweenBuild(): number;
	sendNotification(cmd: string, params: any[]): void;
	showWarningMessage(msg: string): void;
	showErrorMessage(msg: string): void;
	showInformationMessage(msg: string): void;
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

	Input(options: InputOptions): Promise<string | null>;
	Select(items: SelectItem[], options: SelectOptions): Promise<SelectItem | null>;
	SelectMultiple(items: SelectItem[], options: SelectOptions): Promise<SelectItem[] | null>;
	Popup(text: string, ...choices: string[]): Promise<string | null>;
	SelectFolder(text: string, path: string): Promise<string | null>;
}

export interface InputOptions {
	title: string,
	value?: string,
	validations?: { regex: string, message: string }[]
}



export interface AvInitializeParams {
	workspaceFolders: WorkspaceFolder[] | null;
	savePath?: string,
	extensionPath: string,
	isIDE: boolean,
}

export interface SelectOptions {
	placeHolder?: string,
	title?: string,
}

export interface SelectItem {
	label: string,
	detail?: string,
	picked?: boolean,
}