import { normalize, sep } from "path";
import { CodeAction, CompletionItem, CompletionList, Definition, Diagnostic, FormattingOptions, Hover, Location, Position, Range, TextEdit, CodeLens, WorkspaceEdit } from "vscode-languageserver";
import { AventusExtension } from "../../definition";
import { AventusFile } from '../../files/AventusFile';
import { FilesManager } from '../../files/FilesManager';
import { Build } from "../../project/Build";
import { createErrorScssPos } from "../../tools";
import { AventusBaseFile } from "../BaseFile";
import { writeFileSync } from 'fs';
import { HttpServer } from '../../live-server/HttpServer';
const nodeSass = require('sass');

export class AventusGlobalComponentSCSSFile extends AventusBaseFile {
	private usedBy: { [uri: string]: AventusGlobalComponentSCSSFile } = {};
	private dependances: { [uri: string]: AventusGlobalComponentSCSSFile } = {};

	private diagnostics: Diagnostic[] = [];
	private compiledTxt: string = "";
	private outputFile?: string;
	private name: string;

	public get compileResult() {
		return this.compiledTxt;
	}

	public constructor(file: AventusFile, build: Build, name: string, outputFile?: string) {
		super(file, build);
		this.name = name;
		this.outputFile = outputFile;
		this.loadDependances();
		this.compile();
	}

	protected async onValidate(): Promise<Diagnostic[]> {
		this.diagnostics = await this.build.scssLanguageService.doValidation(this.file);
		this.loadDependances();

		return this.diagnostics;
	}
	protected async onContentChange(): Promise<void> {

	}
	protected async onSave() {
		this.compileRoot();
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
				let textToSearch = file.content;
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
				let compiled = nodeSass.compileString(oneFileContent, {
					style: 'compressed'
				}).css.toString().trim();
				newCompiledTxt = compiled;
			}


			if (newCompiledTxt != this.compiledTxt) {
				this.compiledTxt = newCompiledTxt;
				if (this.outputFile) {
					writeFileSync(this.outputFile, this.compiledTxt);
					HttpServer.getInstance().reload();
				}
				else {
					HttpServer.getInstance().updateGlobalCSS(this.name, this.compiledTxt);
				}

				this.build.build();
			}
		} catch (e) {
			console.error(e);
		}
	}
	protected async onDelete() {
		for (let dependanceUri in this.dependances) {
			this.removeDependance(dependanceUri);
		}
		for (let usedByUri in this.usedBy) {
			delete this.usedBy[usedByUri].dependances[this.file.uri];
			delete this.usedBy[usedByUri];
			await this.usedBy[usedByUri].onContentChange();
		}
	}
	protected async onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
		let result: CompletionList = { isIncomplete: false, items: [] };
		result = await this.build.scssLanguageService.doComplete(document, position);
		// add custom completion here or inside the languageService
		return result;
	}
	protected async onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem> {
		return item;
	}
	protected async onHover(document: AventusFile, position: Position): Promise<Hover | null> {
		return this.build.scssLanguageService.doHover(document, position);
	}
	protected async onDefinition(document: AventusFile, position: Position): Promise<Definition | null> {
		return this.build.scssLanguageService.findDefinition(document, position);
	}
	protected async onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
		return this.build.scssLanguageService.format(document, range, options);
	}
	protected async onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
		return this.build.scssLanguageService.doCodeAction(document, range);
	}
	protected async onReferences(document: AventusFile, position: Position): Promise<Location[]> {
		return await this.build.scssLanguageService.onReferences(document, position);
	}
	protected async onCodeLens(document: AventusFile): Promise<CodeLens[]> {
		return []
	}
	protected onGetBuild(): Build[] {
		return [this.build]
	}
	protected async onRename(document: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null> {
		return null;
	}


	//#region dependances
	private loadDependances() {
		let text = this.file.content;
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
				this.diagnostics.push(createErrorScssPos(this.file.document, "Can't load this file", start, end));
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
		if (this.build.globalComponentSCSSFiles[fileDependance.uri]) {
			this.dependances[fileDependance.uri] = this.build.globalComponentSCSSFiles[fileDependance.uri];
			this.build.globalComponentSCSSFiles[fileDependance.uri].usedBy[this.file.uri] = this;
		}
	}

	private resolvePath(loadingPath: string, currentFolder: string): AventusFile | undefined {
		loadingPath = this.build.project.resolveAlias(loadingPath, this.file);
		loadingPath = normalize(currentFolder + "/" + loadingPath);
		let result: AventusFile | undefined = FilesManager.getInstance().getByPath(loadingPath);
		if (result) {
			return result;
		}
		let pathWithExtension = loadingPath + AventusExtension.ComponentGlobalStyle;
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
		let pathWithUnderscoreExtension = pathWithUnderscore + AventusExtension.ComponentGlobalStyle;
		result = FilesManager.getInstance().getByPath(pathWithUnderscoreExtension);
		if (result) {
			return result;
		}
		return undefined;
	}
	//#endregion
}
