import { Diagnostic, Position, CompletionList, CompletionItem, Hover, Definition, Range, FormattingOptions, TextEdit, CodeAction, Location, CodeLens, WorkspaceEdit } from 'vscode-languageserver';
import { AventusFile } from '../../files/AventusFile';
import { Build } from '../../project/Build';
import { AventusGlobalBaseFile } from '../GlobalBaseFile';
import { normalize, sep } from 'path';
import { FilesManager } from '../../files/FilesManager';
import { AventusExtension } from '../../definition';
import { createErrorScss, createErrorScssPos } from '../../tools';
import { Project } from '../../project/Project';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { Exception, compileString } from 'sass';
import { GenericServer } from '../../GenericServer';


export class AventusGlobalSCSSFile extends AventusGlobalBaseFile {
	public compiledVersion = -1;
	private usedBy: { [uri: string]: AventusGlobalSCSSFile } = {};
	private dependances: { [uri: string]: AventusGlobalSCSSFile } = {};

	private diagnostics: Diagnostic[] = [];
	private diagnosticCompile: Diagnostic | undefined;
	private compiledTxt: string = "";
	private savedOnce: boolean = false;

	private outPaths: string[] = [];

	public get resultCompiled() {
		return this.compiledTxt;
	}


	public constructor(file: AventusFile, project: Project) {
		super(file, project);
		this.loadDependances();
		this.project.globalSCSSLanguageService.loadVariables(this, this.file.uri);
	}
	protected async onContentChange(): Promise<void> {

	}
	protected async onValidate(): Promise<Diagnostic[]> {
		this.diagnostics = await this.project.globalSCSSLanguageService.doValidation(this.file);
		this.loadDependances();
		if(this.diagnosticCompile) {
            return [...this.diagnostics, this.diagnosticCompile];
        }
		return this.diagnostics;
	}
	protected async onSave(): Promise<void> {
		this.savedOnce = true;
		this.compileRoot();
		this.project.globalSCSSLanguageService.loadVariables(this, this.file.uri);
	}
	private compileRoot() {
		if (Object.values(this.usedBy).length == 0) {
			// it's a root file
			this.compile();
		}
		else {
			// it's a depend file like vars file
			for (let uri in this.usedBy) {
				this.usedBy[uri].onSave();
			}
		}
	}
	private compile() {
		try {
			let newCompiledTxt = this.compiledTxt;

			let errorMsgTxt = "|error|";
			const _loadContent = (file: AventusFile): string => {
				let textToSearch = file.contentUser;
				//remove comment 
				textToSearch = textToSearch.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1');

				let regex = /@import *?('|")(\S*?)('|");?/g;
				let arrMatch: RegExpExecArray | null = null;
				while (arrMatch = regex.exec(textToSearch)) {
					let importName = arrMatch[2];
					let fileDependance = this.resolvePath(importName, file.folderPath);
					if (fileDependance) {
						let nesteadContent = _loadContent(fileDependance);
						if (nesteadContent == errorMsgTxt) {
							return nesteadContent;
						}
						textToSearch = textToSearch.replace(arrMatch[0], nesteadContent);
					}
					else {
						return errorMsgTxt;
					}
				}
				return textToSearch;
			}
			let oneFileContent = _loadContent(this.file);
			if (oneFileContent != "|error|") {
				try {
                    let compiled = compileString(oneFileContent, {
                        style: 'compressed'
                    }).css.toString().trim();
                    newCompiledTxt = compiled;
					if(this.diagnosticCompile) {
						this.diagnosticCompile = undefined;
						GenericServer.sendDiagnostics({ uri: this.file.uri, diagnostics: this.diagnostics })
					}
                } catch (e: any) {
                    if (e instanceof Exception) {
						this.diagnosticCompile = createErrorScss(this.file.documentUser, e.message);
                        const diagnostics = [...this.diagnostics, this.diagnosticCompile];
                        GenericServer.sendDiagnostics({ uri: this.file.uri, diagnostics: diagnostics })
                    }
                }
			}


			if (newCompiledTxt != this.compiledTxt) {
				this.compiledVersion++;
				this.compiledTxt = newCompiledTxt;
				this.export();
			}
		} catch (e) {
			console.error(e);
		}
	}
	protected async onDelete(): Promise<void> {
		for (let dependanceUri in this.dependances) {
			this.removeDependance(dependanceUri);
		}
		for (let usedByUri in this.usedBy) {
			delete this.usedBy[usedByUri].dependances[this.file.uri];
			delete this.usedBy[usedByUri];
			await this.usedBy[usedByUri].onContentChange();
		}
		this.project.globalSCSSLanguageService.removeVariables(this.file.uri);
	}
	protected async onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
		let result: CompletionList = { isIncomplete: false, items: [] };
		result = await this.project.globalSCSSLanguageService.doComplete(document, position);
		return result;
	}
	protected async onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem> {
		return item;
	}
	protected async onHover(document: AventusFile, position: Position): Promise<Hover | null> {
		return this.project.globalSCSSLanguageService.doHover(document, position);
	}
	protected async onDefinition(document: AventusFile, position: Position): Promise<Definition | null> {
		return this.project.globalSCSSLanguageService.findDefinition(document, position);
	}
	protected async onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
		return this.project.globalSCSSLanguageService.format(document, range, options);
	}
	protected async onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
		return this.project.globalSCSSLanguageService.doCodeAction(document, range);
	}
	protected async onReferences(document: AventusFile, position: Position): Promise<Location[]> {
		return await this.project.globalSCSSLanguageService.onReferences(document, position);
	}
	protected async onCodeLens(document: AventusFile): Promise<CodeLens[]> {
		return [];
	}
	protected async onRename(document: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null> {
		return null;
	}

	public addOutPath(path: string) {
		if (this.file.shortname.startsWith("_")) {
			return;
		}
		if (!this.outPaths.includes(path)) {
			this.outPaths.push(path);
			if (!this.savedOnce) {
				this.onSave();
			}
			else {
				this.export();
			}
		}
	}

	private export() {
		for (let outPath of this.outPaths) {
			let pathOut = normalize(outPath);
			let splitted = pathOut.split(sep);
			splitted.pop();
			let folder = splitted.join(sep);

			if (!existsSync(folder)) {
				mkdirSync(folder, { recursive: true });
			}
			writeFileSync(pathOut, this.compiledTxt);
		}
	}



	//#region dependances
	private loadDependances() {
		let text = this.file.contentUser;
		let textToSearch = text.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1')
		let regex = /@import *?('|")(\S*?)('|");?/g;
		let arrMatch: RegExpExecArray | null = null;
		for (let dependanceUri in this.dependances) {
			this.removeDependance(dependanceUri);
		}
		while (arrMatch = regex.exec(textToSearch)) {
			let importName = arrMatch[2];
			let fileDependance = this.resolvePath(importName, this.file.folderPath);
			if (!fileDependance) {
				let start = text.indexOf(arrMatch[0]);
				let end = start + arrMatch[0].length;
				this.diagnostics.push(createErrorScssPos(this.file.documentUser, "Can't load this file", start, end));
			}
			else {
				this.addDependance(fileDependance);
			}
		}
	}

	private removeDependance(uri: string): void {
		if (this.dependances[uri]) {
			delete this.dependances[uri].usedBy[this.file.uri];
			delete this.dependances[uri];
		}
	}
	private addDependance(fileDependance: AventusFile): void {
		if (this.project.scssFiles[fileDependance.uri]) {
			this.dependances[fileDependance.uri] = this.project.scssFiles[fileDependance.uri];
			this.project.scssFiles[fileDependance.uri].usedBy[this.file.uri] = this;
		}
		else if (fileDependance.uri.endsWith(AventusExtension.GlobalStyle)) {
			this.project.scssFiles[fileDependance.uri] = new AventusGlobalSCSSFile(fileDependance, this.project);
			this.dependances[fileDependance.uri] = this.project.scssFiles[fileDependance.uri];
			this.project.scssFiles[fileDependance.uri].usedBy[this.file.uri] = this;
		}
	}

	private resolvePath(loadingPath: string, currentFolder: string): AventusFile | undefined {
		loadingPath = this.project.resolveAlias(loadingPath, currentFolder);
		loadingPath = normalize(currentFolder + "/" + loadingPath);
		let result: AventusFile | undefined = FilesManager.getInstance().getByPath(loadingPath);
		if (result) {
			return result;
		}
		let pathWithExtension = loadingPath + AventusExtension.GlobalStyle;
		result = FilesManager.getInstance().getByPath(pathWithExtension)
		if (result) {
			return result;
		}
		let splitted = loadingPath.split(sep);
		splitted[splitted.length - 1] = "_" + splitted[splitted.length - 1];
		let pathWithUnderscore = splitted.join(sep);
		result = FilesManager.getInstance().getByPath(pathWithUnderscore)
		if (result) {
			return result;
		}
		let pathWithUnderscoreExtension = pathWithUnderscore + AventusExtension.GlobalStyle;
		result = FilesManager.getInstance().getByPath(pathWithUnderscoreExtension);
		if (result) {
			return result;
		}
		return undefined;
	}
	//#endregion
}