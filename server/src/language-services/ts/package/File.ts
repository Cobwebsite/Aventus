import { Diagnostic, Position, CompletionList, CompletionItem, Hover, Definition, Range, FormattingOptions, TextEdit, CodeAction, Location, CodeLens, WorkspaceEdit } from 'vscode-languageserver';
import { AventusFile, InternalAventusFile } from '../../../files/AventusFile';
import { Build } from '../../../project/Build';
import { AventusBaseFile } from '../../BaseFile';
import { HTMLDoc } from '../../html/helper/definition';
import { SCSSDoc } from '../../scss/helper/CSSNode';
import { AventusTsFile } from '../File';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusExtension, AventusLanguageId } from '../../../definition';
import { ClassInfo } from '../parser/ClassInfo';
import { AventusConfigBuildDependance } from '../../json/definition';
import { InfoType } from '../parser/BaseInfo';
import { GenericServer } from '../../../GenericServer';


export interface AventusPackageTsFileExport {
	fullName: string;
	dependances: { fullName: string; isStrong: boolean }[];
	type: InfoType,
	code: string;
	required?: boolean | undefined;
	noNamespace?: "before" | "after" | undefined;
	isExported: boolean,
	convertibleName: string,
}
export interface AventusPackageTsFileExportNoCode {
	fullName: string;
	dependances: { fullName: string; isStrong: boolean }[];
}
export class AventusPackageFile extends AventusBaseFile {
	private tsFile: InternalAventusFile | null = null;
	private tsDef: AventusPackageFileTs | null = null;
	private tsDefStart: number = 0;
	public srcInfo: {
		namespace: string,
		available: AventusPackageTsFileExport[],
		existing: AventusPackageTsFileExportNoCode[]
	} = { namespace: '', available: [], existing: [] }; // order from the less dependant to the most dependant

	public externalCSS: { [name: string]: string } = {};

	public name: string = "";
	public version = {
		major: 1,
		minor: 0,
		patch: 0
	}
	public get versionTxt() {
		return this.version.major + "." + this.version.minor + "." + this.version.patch;
	}

	public get classInfoByName(): { [name: string]: ClassInfo } {
		return this.tsDef?.classInfoByName || {};
	}


	public dependances: AventusConfigBuildDependance[] = [];

	public constructor(file: AventusFile, build: Build) {
		super(file, build);
		this.prepareFile();
	}

	public loadWebComponents() {
		this.tsDef?.loadWebComponents();
	}

	private prepareFile() {
		let result = this.separeSection();
		if (result) {
			// definition TS
			let documentTs = TextDocument.create(this.file.uri, AventusLanguageId.TypeScript, this.file.version, result.jsDef);
			if (!this.tsFile) {
				this.tsFile = new InternalAventusFile(documentTs);
				this.tsDef = new AventusPackageFileTs(this.tsFile, this.build);
			}
			else {
				this.tsFile.triggerContentChange(documentTs);
			}
			// Src TS
			try {
				this.srcInfo = JSON.parse(result.jsSrc);
			}
			catch (e) {

			}
			// SCSS DEF
			try {
				let doc = JSON.parse(result.scssDefTxt) as SCSSDoc;
				this.build.scssLanguageService.addExternalDefinition(this.file.uri, doc);
			}
			catch (e) {

			}
			// SCSS
			try {
				this.externalCSS = JSON.parse(result.scssTxt);
			}
			catch (e) {

			}
			// HTML
			try {
				let doc = JSON.parse(result.htmlTxt) as HTMLDoc;
				this.build.htmlLanguageService.addExternalDefinition(this.file.uri, doc);
			}
			catch (e) {

			}
			// Dependances
			try {
				this.dependances = JSON.parse(result.depsTxt);
			}
			catch (e) {

			}

			this.build.externalPackageInformation.rebuild();
		}
	}


	private separeSection() {
		if (this.file.content.match(/\/\/#region js def \/\/((\s|\S)*)\/\/#endregion js def \/\//g)) {
			let regexInfo = /^\/\/ (\S+):([0-9]+)\.([0-9]+)\.([0-9]+)$/gm.exec(this.file.content);
			if (regexInfo) {
				this.name = regexInfo[1];
				this.version.major = Number(regexInfo[2]);
				this.version.minor = Number(regexInfo[3]);
				this.version.patch = Number(regexInfo[4]);
			}
			let jsDefToImport = /\/\/#region js def \/\/((\s|\S)*)\/\/#endregion js def \/\//g.exec(this.file.content);
			let jsDef = "";
			if (jsDefToImport) {
				this.tsDefStart = jsDefToImport.index + 15;
				jsDef = jsDefToImport[1];
			}

			let jsSrcToImport = /\/\/#region js src \/\/((\s|\S)*)\/\/#endregion js src \/\//g.exec(this.file.content);
			let jsSrc = "";
			if (jsSrcToImport) {
				this.tsDefStart = jsSrcToImport.index + 15;
				jsSrc = jsSrcToImport[1];
			}

			let scssToImport = /\/\/#region css \/\/((\s|\S)*)\/\/#endregion css \/\//g.exec(this.file.content);
			let scssTxt = "";
			if (scssToImport) {
				scssTxt = scssToImport[1];
			}

			let scssDefToImport = /\/\/#region css def \/\/((\s|\S)*)\/\/#endregion css def \/\//g.exec(this.file.content);
			let scssDefTxt = "";
			if (scssDefToImport) {
				scssDefTxt = scssDefToImport[1];
			}


			let htmlToImport = /\/\/#region html \/\/((\s|\S)*)\/\/#endregion html \/\//g.exec(this.file.content);
			let htmlTxt = "";
			if (htmlToImport) {
				htmlTxt = htmlToImport[1];
			}

			let depsToImport = /\/\/#region dependances \/\/((\s|\S)*)\/\/#endregion dependances \/\//g.exec(this.file.content);
			let depsTxt = "";
			if (depsToImport) {
				depsTxt = depsToImport[1];
			}

			return {
				jsDef,
				jsSrc,
				scssDefTxt,
				scssTxt,
				htmlTxt,
				depsTxt
			};
		}
		return null;
	}

	protected async onContentChange(): Promise<void> {
		this.prepareFile();
	}
	protected async onValidate(): Promise<Diagnostic[]> {
		return [];
	}
	protected async onSave(): Promise<void> {

	}
	protected async onDelete(): Promise<void> {
		this.build.scssLanguageService.removeExternalDefinition(this.file.uri);
		this.build.htmlLanguageService.removeExternalDefinition(this.file.uri);
		if (this.tsFile) {
			this.tsFile.triggerDelete();
		}
	}
	protected async onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
		return { isIncomplete: true, items: [] }
	}
	protected async onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem> {
		return item;
	}
	protected async onHover(document: AventusFile, position: Position): Promise<Hover | null> {
		return null;
	}
	protected async onDefinition(document: AventusFile, position: Position): Promise<Definition | null> {
		if (this.tsFile) {
			let currentOffset = document.document.offsetAt(position);
			let newPosition = this.tsFile.document.positionAt(currentOffset - this.tsDefStart)
			return await this.tsFile.getDefinition(newPosition);
		}
		return null;
	}
	protected async onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
		return [];
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
	protected onGetBuild(): Build[] {
		return [this.build]
	}

	private transformPosition(fileFrom: AventusBaseFile, positionFrom: Position, fileTo: AventusBaseFile, offset: number): Position {
		let currentOffset = fileFrom.file.document.offsetAt(positionFrom);
		return fileTo.file.document.positionAt(currentOffset - offset);
	}
}


export class AventusPackageFileTs extends AventusTsFile {
	private _classInfoByName: { [name: string]: ClassInfo } = {};
	protected get extension(): string {
		return AventusExtension.Package;
	}
	public get classInfoByName() {
		return this._classInfoByName;
	}


	public constructor(file: AventusFile, build: Build) {
		super(file, build);
	}

	public loadWebComponents() {
		try {
			this.refreshFileParsed(true);
			let structJs = this.fileParsed;
			if (structJs) {
				let nameToCheck = "Aventus.DefaultComponent";
				let nameIDataToCheck = "Aventus.IData";
				for (let className in structJs.classes) {
					let classInfo = structJs.classes[className];
					// Check if classInfo implements DefaultComponent
					let foundDefaultComponent = false;
					let foundIData = false;
					for (let implement of classInfo.implements) {
						if (implement == nameToCheck) {
							foundDefaultComponent = true;
							break;
						}
						if (implement == nameIDataToCheck) {
							foundIData = true;
							break;
						}
					}

					if (foundDefaultComponent) {
						this._classInfoByName[classInfo.fullName] = classInfo;
					}
				}
			}
		} catch {
			let splitted = this.file.uri.split("/");
			let fileName = splitted[splitted.length - 1];
			GenericServer.showErrorMessage("There is an error inside file :" + fileName);
		}
	}
	protected async onContentChange(): Promise<void> {
		this.loadWebComponents();
	}
	protected async onValidate(): Promise<Diagnostic[]> {
		return [];
	}
	protected async onSave(): Promise<void> {
	}
	protected async onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
		return { isIncomplete: false, items: [] };
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
		return [];
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