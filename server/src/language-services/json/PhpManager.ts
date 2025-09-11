import { CodeAction, CodeLens, CompletionItem, CompletionList, Diagnostic, FormattingOptions, Hover, Location, Position, TextEdit, WorkspaceEdit, Range } from 'vscode-languageserver';
import { AventusFile, InternalAventusFile } from '../../files/AventusFile';
import { FilesManager } from '../../files/FilesManager';
import { AventusJSONLanguageService } from './LanguageService';
import { AventusExtension } from '../../definition';

export class PhpManager {
	private static instance: PhpManager;
	public static getInstance() {
		if (!this.instance) {
			this.instance = new PhpManager();
		}
		return this.instance;
	}

	public files: { [uri: string]: PhpFile } = {};
	private onNewFileUUID: string;
	private onFileRemoveUUID: string;
	private constructor() {
		this.onNewFile = this.onNewFile.bind(this);
		this.onFileRemove = this.onFileRemove.bind(this);
		this.onNewFileUUID = FilesManager.getInstance().onNewFile(this.onNewFile);
		this.onFileRemoveUUID = FilesManager.getInstance().onFileRemove(this.onFileRemove);
	}

	private async onNewFile(document: AventusFile) {
		if (document.uri.endsWith(AventusExtension.PhpConfig)) {
			this.files[document.uri] = new PhpFile(document);
		}
	}

	private async onFileRemove(uri: string) {
		delete this.files[uri];
	}

	public destroy() {
		FilesManager.getInstance().removeOnNewFile(this.onNewFileUUID);
		FilesManager.getInstance().removeOnFileRemove(this.onFileRemoveUUID);
	}
}

export class PhpFile {
	protected _file: AventusFile;

	public get file() {
		return this._file;
	}


	public constructor(file: AventusFile) {
		this._file = file;
		this.addEvents();

	}


	private uuidEvents = {
		onContentChange: '',
		onValidate: '',
		onSave: '',
		onDelete: '',
		onCompletion: '',
		onCompletionResolve: '',
		onHover: '',
		onDefinition: '',
		onFormatting: '',
		onCodeAction: '',
		onReferences: '',
		onCodeLens: '',
		onRename: ''
	}
	private addEvents(): void {
		this.uuidEvents.onContentChange = this.file.onContentChange(this.onContentChange.bind(this));
		this.uuidEvents.onValidate = this.file.onValidate(this._onValidate.bind(this));
		this.uuidEvents.onSave = this.file.onSave(this.onSave.bind(this));
		this.uuidEvents.onDelete = this.file.onDelete(this._onDelete.bind(this));
		this.uuidEvents.onCompletion = this.file.onCompletion(this.onCompletion.bind(this));
		this.uuidEvents.onCompletionResolve = this.file.onCompletionResolve(this.onCompletionResolve.bind(this));
		this.uuidEvents.onHover = this.file.onHover(this.onHover.bind(this));
		this.uuidEvents.onDefinition = this.file.onDefinition(this.onDefinition.bind(this));
		this.uuidEvents.onFormatting = this.file.onFormatting(this.onFormatting.bind(this));
		this.uuidEvents.onCodeAction = this.file.onCodeAction(this.onCodeAction.bind(this));
		this.uuidEvents.onReferences = this.file.onReferences(this.onReferences.bind(this));
		this.uuidEvents.onCodeLens = this.file.onCodeLens(this.onCodeLens.bind(this));
		this.uuidEvents.onRename = this.file.onRename(this.onRename.bind(this));
	}
	public removeEvents(): void {
		this.file.removeOnContentChange(this.uuidEvents.onContentChange);
		this.file.removeOnValidate(this.uuidEvents.onValidate);
		this.file.removeOnSave(this.uuidEvents.onSave);
		this.file.removeOnDelete(this.uuidEvents.onDelete);
		this.file.removeOnCompletion(this.uuidEvents.onCompletion);
		this.file.removeOnCompletionResolve(this.uuidEvents.onCompletionResolve);
		this.file.removeOnHover(this.uuidEvents.onHover);
		this.file.removeOnDefinition(this.uuidEvents.onDefinition);
		this.file.removeOnFormatting(this.uuidEvents.onFormatting);
		this.file.removeOnCodeAction(this.uuidEvents.onCodeAction);
		this.file.removeOnReferences(this.uuidEvents.onReferences);
		this.file.removeOnCodeLens(this.uuidEvents.onCodeLens);
		this.file.removeOnRename(this.uuidEvents.onRename);

	}

	public async validate() {
		if (this.file instanceof InternalAventusFile) {
			await this.file.validate();
		}
	}
	public triggerSave(): void {
		if (this.file instanceof InternalAventusFile) {
			this.file.triggerSave();
		}
	}
	public async triggerContentChange(): Promise<void> {
		if (this.file instanceof InternalAventusFile) {
			await this.file.triggerContentChange(this.file.documentUser);
		}
	}
	private async _onValidate(): Promise<Diagnostic[]> {
		return await this.onValidate();
	}
	protected async onContentChange(): Promise<void> {

	}

	protected async onValidate(): Promise<Diagnostic[]> {
		return AventusJSONLanguageService.getInstance().validate(this.file);
	}
	protected async onSave(): Promise<void> {

	}
	protected async onDelete(): Promise<void> {

	}
	private async _onDelete(): Promise<void> {
		await this.onDelete();
		this.removeEvents();
	}

	protected async onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
		return AventusJSONLanguageService.getInstance().doComplete(document, position);
	}
	protected async onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem> {
		return AventusJSONLanguageService.getInstance().doResolve(item);
	}
	protected async onHover(document: AventusFile, position: Position): Promise<Hover | null> {
		return AventusJSONLanguageService.getInstance().doHover(document, position);
	}
	protected async onDefinition(document: AventusFile, position: Position): Promise<Location[] | null> {
		return null;

	}
	protected async onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
		return AventusJSONLanguageService.getInstance().format(document, range, options);

	}
	protected async onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
		return [];
	}
	protected async onReferences(document: AventusFile, position: Position): Promise<Location[]> {
		return [];
	}
	protected async onCodeLens(document: AventusFile): Promise<CodeLens[]> {
		return [];
	}
	protected async onRename(document: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null> {
		return null;
	}
}