import { Diagnostic, Position, CompletionList, CompletionItem, Hover, Definition, Range, FormattingOptions, TextEdit, CodeAction, Location, CodeLens, WorkspaceEdit } from 'vscode-languageserver';
import { AventusFile, InternalAventusFile } from '../../files/AventusFile';
import { Build } from '../../project/Build';
import { AventusBaseFile } from '../BaseFile';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusI18nLanguageService } from './LanguageService';
import { I18nParsed, I18nParser } from './Parser';
import { AventusExtension } from '../../definition';
import { AventusWebComponentLogicalFile } from '../ts/component/File';
import { ClassInfo } from '../ts/parser/ClassInfo';

export type AventusI18nFileSrcParsed = { [key: string]: { [locale: string]: string } };
export type AventusI18nExported = { [locales: string]: { [key: string]: string } };
export class AventusI18nFile extends AventusBaseFile {


	public parsedSrc: AventusI18nFileSrcParsed = {};
	public parsed?: I18nParsed;
	public exported: AventusI18nExported = {};

	public get classInfo(): ClassInfo | undefined {
		var tsFile = this.build.tsFiles[this.file.uri.replace(AventusExtension.I18n, AventusExtension.ComponentLogic)];
		if (tsFile instanceof AventusWebComponentLogicalFile && tsFile.fileParsed) {
			return tsFile.fileParsed.classes[tsFile.componentClassName];
		}
		return undefined
	}

	public isGlobal: boolean = false;

	public get keys(): string[] {
		return Object.keys(this.parsedSrc);
	}

	public constructor(file: AventusFile, isGlobal: boolean, build?: Build) {
		super(file, build);
		this.isGlobal = isGlobal;
		this.onContentChange();
	}

	protected async onContentChange(): Promise<void> {
		try {
			this.parsedSrc = JSON.parse(this.file.contentUser);
			this.parsed = I18nParser.parse(this.file.documentUser);
			this.transformForExport();
			if (this.file instanceof InternalAventusFile) {
				if (this.isGlobal) {
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
		}
		catch (e) {

		}
	}
	public transformForExport() {
		const result: AventusI18nExported = {};
		const locales = this.build.buildConfig.i18n?.locales ?? [];
		for (let locale of locales) {
			result[locale] = {};
		}
		if (this.isGlobal) {
			for (let key in this.parsedSrc) {
				for (let locale in this.parsedSrc[key]) {
					if (!locales.includes(locale)) continue;

					result[locale][key] = this.parsedSrc[key][locale];
				}
			}
		}
		else {
			let prefix = this.build.module + "°" + (this.classInfo?.fullName.replace(/\./g, "°") ?? '');
			if (prefix) {
				prefix += '°';
			}
			this.build.module
			for (let key in this.parsedSrc) {
				for (let locale in this.parsedSrc[key]) {
					if (!locales.includes(locale)) continue;

					result[locale][prefix + key] = this.parsedSrc[key][locale];
				}
			}
		}
		this.exported = result;
	}
	protected async onValidate(): Promise<Diagnostic[]> {
		const diags: Diagnostic[] = await AventusI18nLanguageService.getInstance().validate(this);
		return diags;
	}
	protected async onSave(): Promise<void> {
		this.build.build()
	}
	protected async onDelete(): Promise<void> {
		this.build.build()
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