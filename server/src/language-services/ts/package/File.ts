import { Diagnostic, Position, CompletionList, CompletionItem, Hover, Range, FormattingOptions, TextEdit, CodeAction, Location, CodeLens, WorkspaceEdit } from 'vscode-languageserver';
import { AventusFile, InternalAventusFile } from '../../../files/AventusFile';
import { Build } from '../../../project/Build';
import { AventusBaseFile } from '../../BaseFile';
import { HTMLDoc } from '../../html/helper/definition';
import { SCSSDoc } from '../../scss/helper/CSSCustomNode';
import { AventusTsFile } from '../File';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusExtension, AventusLanguageId } from '../../../definition';
import { ClassInfo } from '../parser/ClassInfo';
import { AventusConfigBuildDependance } from '../../json/definition';
import { InfoType } from '../parser/BaseInfo';
import { GenericServer } from '../../../GenericServer';
import { EOL } from 'os';
import { AliasInfo } from '../parser/AliasInfo';
import { EnumInfo } from '../parser/EnumInfo';
import { FunctionInfo } from '../parser/FunctionInfo';
import { VariableInfo } from '../parser/VariableInfo';
import { ParserTs } from '../parser/ParserTs';
import { SlotsInfo } from '../../html/File';


export interface AventusPackageTsFileExport {
	fullName: string;
	dependances: { fullName: string; isStrong: boolean }[];
	type: InfoType,
	code: string;
	required?: boolean | undefined;
	noNamespace?: "before" | "after" | undefined;
	isExported: boolean,
	convertibleName: string,
	tagName?: string,
	slots?: SlotsInfo
}
export interface AventusPackageTsFileExportNoCode {
	fullName: string;
	dependances: { fullName: string; isStrong: boolean }[];
}
export class AventusPackageFile extends AventusBaseFile {
	public static getQuickInfo(file: AventusFile): { name: string, version: { major: number, minor: number, patch: number } } | undefined {
		if (file.contentUser.match(/\/\/#region js def \/\/((\s|\S)*)\/\/#endregion js def \/\//g)) {
			let regexInfo = /^\/\/ (\S+):([0-9]+)\.([0-9]+)\.([0-9]+)$/gm.exec(file.contentUser);
			if (regexInfo) {
				return {
					name: regexInfo[1],
					version: {
						major: Number(regexInfo[2]),
						minor: Number(regexInfo[3]),
						patch: Number(regexInfo[4]),
					}
				}
			}
		}
		return undefined;
	}

	private tsFile: InternalAventusFile | null = null;
	private tsDef: AventusPackageFileTs | null = null;
	public srcInfo: {
		namespace: string,
		available: AventusPackageTsFileExport[],
		existing: AventusPackageTsFileExportNoCode[]
	} = { namespace: '', available: [], existing: [] }; // order from the less dependant to the most dependant

	public externalCSS: { [name: string]: string } = {};

	public name: string = "";
	public npmUri: string = "";
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

	public get fileParsed(): ParserTs | null {
		return this.tsDef?.fileParsed || null;
	}


	public dependances: { [name: string]: AventusConfigBuildDependance } = {};

	public constructor(file: AventusFile, build: Build) {
		super(file, build);
		this.prepareFile();
	}

	public async refreshDeprecated(sendRevalidate: boolean) {
		if (this.tsDef)
			await this.tsDef.refreshDeprecated(sendRevalidate);
	}

	public loadWebComponents() {
		this.tsDef?.loadWebComponents();
	}

	private prepareFile() {
		let result = this.separeSection();
		if (result) {
			// definition TS
			let documentTs = TextDocument.create(this.file.uri, AventusLanguageId.TypeScript, this.file.versionUser, result.jsDef);
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
		if (this.file.contentUser.match(/\/\/#region js def \/\/((\s|\S)*)\/\/#endregion js def \/\//g)) {
			let regexInfo = /^\/\/ (\S+):([0-9]+)\.([0-9]+)\.([0-9]+)$/gm.exec(this.file.contentUser);
			if (regexInfo) {
				this.name = regexInfo[1];
				this.version.major = Number(regexInfo[2]);
				this.version.minor = Number(regexInfo[3]);
				this.version.patch = Number(regexInfo[4]);
			}
			let jsDefToImport = /((\s|\S)*)\/\/#endregion js def \/\//g.exec(this.file.contentUser);
			let jsDef = "";
			if (jsDefToImport) {
				jsDef = jsDefToImport[0];
			}

			let jsSrcToImport = /\/\/#region js src \/\/((\s|\S)*)\/\/#endregion js src \/\//g.exec(this.file.contentUser);
			let jsSrc = "";
			if (jsSrcToImport) {
				jsSrc = jsSrcToImport[1];
			}

			let scssToImport = /\/\/#region css \/\/((\s|\S)*)\/\/#endregion css \/\//g.exec(this.file.contentUser);
			let scssTxt = "";
			if (scssToImport) {
				scssTxt = scssToImport[1];
			}

			let scssDefToImport = /\/\/#region css def \/\/((\s|\S)*)\/\/#endregion css def \/\//g.exec(this.file.contentUser);
			let scssDefTxt = "";
			if (scssDefToImport) {
				scssDefTxt = scssDefToImport[1];
			}


			let htmlToImport = /\/\/#region html \/\/((\s|\S)*)\/\/#endregion html \/\//g.exec(this.file.contentUser);
			let htmlTxt = "";
			if (htmlToImport) {
				htmlTxt = htmlToImport[1];
			}

			let depsToImport = /\/\/#region dependances \/\/((\s|\S)*)\/\/#endregion dependances \/\//g.exec(this.file.contentUser);
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
		this.build.reloadPage = true;
		this.build.build()
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
		if (this.tsFile) {
			return this.tsFile.getHover(position);
		}
		return null;
	}
	protected async onDefinition(document: AventusFile, position: Position): Promise<Location[] | null> {
		if (this.tsFile) {
			// let currentOffset = document.documentUser.offsetAt(position);
			// let newPosition = this.tsFile.documentUser.positionAt(currentOffset - this.tsDefStart)
			return await this.tsFile.getDefinition(position);
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
		if (this.tsFile) {
			return this.tsFile.getReferences(position);
		}
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
		let currentOffset = fileFrom.file.documentUser.offsetAt(positionFrom);
		return fileTo.file.documentUser.positionAt(currentOffset - offset);
	}
}


export class AventusPackageFileTs extends AventusTsFile {
	private _classInfoByName: { [name: string]: ClassInfo } = {};
	private packagesFiles: AventusPackageNamespaceFileTs[] = [];
	public get extension(): string {
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
				this.loadFilePackage();
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
		} catch (e) {
			let splitted = this.file.uri.split("/");
			let fileName = splitted[splitted.length - 1];
			GenericServer.showErrorMessage("There is an error inside file :" + fileName);
			console.log(e);
		}
	}
	protected loadFilePackage() {
		try {
			this.deletePackageFile();
			let structJs = this.fileParsed;
			if (structJs) {
				let content: {
					[name: string]: FileNamespaceInfo
				} = {}

				const loadContent = (infos: {
					[shortName: string]: ClassInfo | AliasInfo | EnumInfo | FunctionInfo | VariableInfo;
				}) => {
					for (let name in infos) {
						let info = infos[name];
						let splitted = info.fullName.split('.');
						splitted.pop()
						let _namespace = splitted.join(".");
						if (!content[_namespace]) {
							content[_namespace] = {
								text: "",
								parts: []
							}
						}
						let startVirtual = content[_namespace].text.length;
						content[_namespace].text += `export import ${name} = ${info.fullName};` + EOL;
						content[_namespace].parts.push({
							startDef: info.start,
							endDef: info.end,
							startVirtual: startVirtual,
							endVirtual: content[_namespace].text.length
						})
					}
				}
				loadContent(structJs.classes);
				loadContent(structJs.aliases);
				loadContent(structJs.enums);
				loadContent(structJs.functions);
				loadContent(structJs.variables);

				for (let _namespace in content) {
					if (_namespace) {
						const name = this.file.name.replace(AventusExtension.Package, "") + ":" + _namespace + AventusExtension.Package;
						this.packagesFiles.push(new AventusPackageNamespaceFileTs(content[_namespace], name, this.build, this))
					}
				}
			}
		}
		catch (e) {
			console.log(e);
		}
	}
	protected deletePackageFile() {
		const files = [...this.packagesFiles];
		this.packagesFiles = [];
		for (let packageFile of files) {
			packageFile.internalFile.triggerDelete();
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
	protected async onDefinition(document: AventusFile, position: Position): Promise<Location[] | null> {
		return this.tsLanguageService.findDefinition(document, position);
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
	protected async onDelete(): Promise<void> {
		await super.onDelete();

	}

}

type FileNamespaceInfo = {
	text: string,
	parts: {
		startDef: number,
		endDef: number,
		startVirtual: number,
		endVirtual: number,
	}[]
}

export class AventusPackageNamespaceFileTs extends AventusTsFile {
	public get extension(): string {
		return AventusExtension.Package;
	}

	public readonly internalFile: InternalAventusFile;
	private info: FileNamespaceInfo;
	private packageFile: AventusPackageFileTs;

	public constructor(info: FileNamespaceInfo, uri: string, build: Build, packageFile: AventusPackageFileTs) {
		const doc = TextDocument.create("file:///" + uri, AventusLanguageId.TypeScript, 1, info.text)
		const file = new InternalAventusFile(doc)
		file.triggerDelete();
		super(file, build);
		this.info = info;
		this.internalFile = file;
		this._contentForLanguageService = info.text;
		this.fileParsed = packageFile.fileParsed;
		this.packageFile = packageFile;
	}

	public async goToDefinition(range: Range): Promise<Location[] | null> {
		let offsetStart = this.file.documentInternal.offsetAt(range.start);
		let offsetEnd = this.file.documentInternal.offsetAt(range.end);
		let length = offsetEnd - offsetStart;

		for (let part of this.info.parts) {
			if (offsetStart >= part.startVirtual && offsetEnd <= part.endVirtual) {
				let diff = offsetStart - part.startVirtual;
				let realStart = part.startDef + diff - "export ".length;
				let realEnd = realStart + length;
				let rangeStart = this.packageFile.file.documentInternal.positionAt(realStart);
				let rangeEnd = this.packageFile.file.documentInternal.positionAt(realEnd);
				return [{
					uri: this.packageFile.file.uri,
					range: {
						start: rangeStart,
						end: rangeEnd
					}
				}]
			}
		}


		return null;
	}

	protected async onContentChange(): Promise<void> {
	}
	protected async onValidate(): Promise<Diagnostic[]> {
		return []
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
	protected async onDefinition(document: AventusFile, position: Position): Promise<Location[] | null> {
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