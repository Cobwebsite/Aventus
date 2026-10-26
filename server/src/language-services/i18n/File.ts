import { Diagnostic, Position, CompletionList, CompletionItem, Hover, Range, FormattingOptions, TextEdit, CodeAction, Location, CodeLens, WorkspaceEdit } from 'vscode-languageserver';
import { AventusFile, InternalAventusFile } from '../../files/AventusFile';
import { Build } from '../../project/Build';
import { AventusBaseFile } from '../BaseFile';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusI18nLanguageService } from './LanguageService';
import { I18nParsed, I18nParser } from './Parser';
import { AventusExtension } from '../../definition';
import { AventusWebComponentLogicalFile } from '../ts/component/File';
import { ClassInfo } from '../ts/parser/ClassInfo';
import { createErrorI18n, EOL } from '../../tools';

export type AventusI18nFileSrcParsed = { [key: string]: { [locale: string]: string } };
export type AventusI18nExported = { [locales: string]: { [key: string]: string } };
export class AventusI18nFile extends AventusBaseFile {


	public parsedSrc: AventusI18nFileSrcParsed = {};
	public parsed?: I18nParsed;
	private _exported: AventusI18nExported = {};
	private exportedLocales = '';
	public get exported(): AventusI18nExported {
		const locales = JSON.stringify(this.build.buildConfig.i18n?.locales ?? []);
		if (locales !== this.exportedLocales) this.transformForExport();
		return this._exported;
	}
	public set exported(value: AventusI18nExported) {
		this._exported = value;
		this.exportedLocales = JSON.stringify(this.build.buildConfig.i18n?.locales ?? []);
	}

	public get classInfo(): ClassInfo | undefined {
		var tsFile = this.build.tsFiles[this.file.uri.replace(AventusExtension.I18n, AventusExtension.ComponentLogic)];
		if (tsFile instanceof AventusWebComponentLogicalFile && !tsFile.file.isDeleted && tsFile.fileParsed) {
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
			const parsed = JSON.parse(this.file.contentUser);
			this.parsedSrc = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
			for (const key of Object.keys(this.parsedSrc)) {
				if (I18nParser.isReservedI18nLocale(key)) delete this.parsedSrc[key];
			}
			this.parsed = I18nParser.parse(this.file.documentUser);
			this.transformForExport();
			if (this.file instanceof InternalAventusFile) {
				if (this.isGlobal) {
					const values = this.keys.map(key => `${JSON.stringify(key)}: string`).join("," + EOL)
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
			// Keep the last valid translations while the user edits invalid JSON.
		}
	}
	public transformForExport() {
		const result: AventusI18nExported = {};
		const locales = (this.build.buildConfig.i18n?.locales ?? []).filter(locale => !I18nParser.isReservedI18nLocale(locale));
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
			const classInfo = this.classInfo;
			if (!classInfo) {
				this.exported = result;
				return;
			}
			let prefix = this.build.module + "°" + classInfo.fullName.replace(/\./g, "°");
			if (prefix) {
				prefix += '°';
			}
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
		if (this.isGlobal) {
			const name = this.file.name.toLowerCase();
			const duplicates: AventusI18nFile[] = [];
			for (const file of Object.values(this.build.tsLanguageService.i18nFiles)) {
				if (file != this && file.isGlobal && file.file.name.toLowerCase() == name) {
					duplicates.push(file);
				}
			}
			if (duplicates.length > 0) {
				const duplicatesUri = duplicates.map(other => other.file.uri).join(', ');
				const errorTxt = 'Global i18n files need distinct names. ' + name + ' is also used by ' + duplicatesUri;
				diags.push(createErrorI18n(this.file.documentUser, errorTxt));
			}
		}
		if (!this.isGlobal && !this.classInfo) {
			diags.push(createErrorI18n(this.file.documentUser, "No matching component class found for this translation file"));
		}
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
	protected async onDefinition(document: AventusFile, position: Position): Promise<Location[] | null> {
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


	public getKeyFromLocation(range: [Position, Position]): string | null {
		if (!this.parsed) return null;

		const start = this.file.documentUser.offsetAt(range[0]);
		const end = this.file.documentUser.offsetAt(range[1]);

		for (let key in this.parsed) {
			const info = this.parsed[key];
			if (info.keyStart <= start && info.keyEnd >= end) {
				return key;
			}
		}
		return null;
	}
}
