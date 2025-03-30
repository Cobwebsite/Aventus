import { Diagnostic, Position, CompletionList, CompletionItem, Hover, Definition, Range, FormattingOptions, TextEdit, CodeAction, Location, CodeLens, WorkspaceEdit } from 'vscode-languageserver';
import { AventusFile, InternalAventusFile } from '../../files/AventusFile';
import { Build } from '../../project/Build';
import { AventusBaseFile } from '../BaseFile';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusI18nLanguageService } from './LanguageService';

export type AventusI18nFileSrcParsed = { [key: string]: { [locale: string]: string } };
export class AventusI18nFile extends AventusBaseFile {

	// declare module "Aventus" {
	// 	interface AventusI18n {
	// 		'resource': string;
	// 	}
	// }

	public parsed: AventusI18nFileSrcParsed = {};

	public get keys(): string[] {
		return Object.keys(this.parsed);
	}

	public constructor(file: AventusFile, build?: Build) {
		super(file, build);
		this.onContentChange();
	}

	protected async onContentChange(): Promise<void> {
		try {
			this.parsed = JSON.parse(this.file.contentInternal);
			if (this.file instanceof InternalAventusFile) {
				const values = this.keys.map(p => `"${p.replace(/"/g, "\\\"")}": string`).join(",\r\n")
				const content = `declare global {
	namespace Aventus { 
		interface AventusI18n {
			${values}
		}
	}
}`;
				this.file.setDocumentInternal(TextDocument.create(this.file.documentUser.uri, this.file.documentUser.languageId, this.file.documentUser.version, content));
			}
		}
		catch (e) {

		}
	}
	protected async onValidate(): Promise<Diagnostic[]> {
		const diags: Diagnostic[] = await AventusI18nLanguageService.getInstance().validate(this);
		return diags;
	}
	protected async onSave(): Promise<void> {
	}
	protected async onDelete(): Promise<void> {
	}
	protected async onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
		return {
			isIncomplete: false,
			items: []
		}
	}
	protected async onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem> {
		return item;
	}
	protected async onHover(document: AventusFile, position: Position): Promise<Hover | null> {
		return null;
	}
	protected async onDefinition(document: AventusFile, position: Position): Promise<Definition | null> {
		return null;
	}
	protected async onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
		return await AventusI18nLanguageService.getInstance().format(document, range, options);
	}
	protected async onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
		return await AventusI18nLanguageService.getInstance().codeAction(this, range);
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
	protected onGetBuild(): Build[] | null {
		return [this.build];
	}
}