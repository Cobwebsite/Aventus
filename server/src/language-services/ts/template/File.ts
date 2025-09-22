import { Diagnostic, Position, CompletionList, CompletionItem, Hover, Range, FormattingOptions, TextEdit, CodeAction, Location, CodeLens, WorkspaceEdit } from 'vscode-languageserver';
import { AventusFile } from '../../../files/AventusFile';
import { Build } from '../../../project/Build';
import { AventusBaseFile } from '../../BaseFile';
import { AventusTemplateLanguageService } from './LanguageService';

export class AventusTemplateFile extends AventusBaseFile {
	
	public languageService: AventusTemplateLanguageService;

	public constructor(file: AventusFile) {
		super(file);
		this.languageService = new AventusTemplateLanguageService();
		this.languageService.addFile(file);
	}

	protected async onValidate(): Promise<Diagnostic[]> {
		return this.languageService.doValidation(this.file);
	}
	protected async onContentChange(): Promise<void> {
	}
	protected async onSave() {
	}
	protected onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
		const result = this.languageService.doComplete(document, position);
		return result;
	}
	protected onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem> {
		const result = this.languageService.doResolve(item);
		return result;
	}
	protected onHover(document: AventusFile, position: Position): Promise<Hover | null> {
		return this.languageService.doHover(document, position);
	}
	protected onDefinition(document: AventusFile, position: Position): Promise<Location[] | null> {
		return this.languageService.findDefinition(document, position);
	}
	protected onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
		return this.languageService.format(document, range, options);
	}
	protected onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
		return this.languageService.doCodeAction(document, range);
	}
	protected onReferences(document: AventusFile, position: Position): Promise<Location[]> {
		return this.languageService.onReferences(document, position);
	}
	protected onCodeLens(document: AventusFile): Promise<CodeLens[]> {
		return this.languageService.onCodeLens(document);
	}
	protected async onRename(document: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null> {
		return this.languageService.onRename(document, position, newName);
	}

	protected async onDelete(): Promise<void> {
	}
	protected onGetBuild(): Build[] | null {
		return null;
	}
}