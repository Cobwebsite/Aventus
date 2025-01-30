import { normalize, sep } from "path";
import { CodeAction, CompletionItem, CompletionList, Definition, Diagnostic, FormattingOptions, Hover, Location, Position, Range, TextEdit, CodeLens, WorkspaceEdit } from "vscode-languageserver";
import { AventusExtension, AventusLanguageId } from "../../definition";
import { AventusFile } from '../../files/AventusFile';
import { FilesManager } from '../../files/FilesManager';
import { HttpServer } from '../../live-server/HttpServer';
import { Build } from "../../project/Build";
import { createErrorScss, createErrorScssPos, pathToUri } from "../../tools";
import { AventusBaseFile } from "../BaseFile";
import { AventusWebComponentLogicalFile } from '../ts/component/File';
import { AventusSCSSLanguageService, SCSSParsedRule } from './LanguageService';
import { AventusHTMLFile } from '../html/File';
import { ParserHtml } from '../html/parser/ParserHtml';
import { Exception, compileString } from 'sass';
import { existsSync, lstatSync, readFileSync } from 'fs';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { GenericServer } from '../../GenericServer';
import { CustomCssProperty } from './helper/CSSNode';

export class AventusWebSCSSFile extends AventusBaseFile {
    public compiledVersion = -1;
    private usedBy: { [uri: string]: AventusWebSCSSFile } = {};
    private dependances: { [uri: string]: AventusWebSCSSFile } = {};

    private diagnostics: Diagnostic[] = [];
    private diagnosticCompile: Diagnostic | undefined;
    private compiledTxt: string = "";
    private namespace: string = "";
    private _rules: SCSSParsedRule = new Map();

    public customProperties: CustomCssProperty[] = [];

    public get compileResult() {
        return this.compiledTxt;
    }

    public get rules() {
        return this._rules;
    }
    public get htmlFile(): AventusHTMLFile | null {
        let file = this.build.htmlFiles[this.file.uri.replace(AventusExtension.ComponentStyle, AventusExtension.ComponentView)];
        if (file instanceof AventusHTMLFile) {
            return file;
        }
        return null;
    }

    public get isGlobal(): boolean {
        return this.file.name.startsWith("@");
    }
    public get globalName(): string {
        let name = this.file.name.replace(AventusExtension.ComponentStyle, "");
        return name;
    }

    public constructor(file: AventusFile, build: Build) {
        super(file, build);
        this.namespace = this.build.getNamespace(file.uri);
    }

    public async init(): Promise<void> {
        await this.loadDependances();
        await this.compile(false);
    }

    protected async onValidate(): Promise<Diagnostic[]> {
        this.diagnostics = await this.build.scssLanguageService.doValidation(this.file);
        await this.loadDependances();
        if (this.diagnosticCompile) {
            return [...this.diagnostics, this.diagnosticCompile];
        }
        return this.diagnostics;
    }
    protected async onContentChange(): Promise<void> {

    }
    protected async onSave() {
        await this.compileRoot();
    }
    private async compileRoot() {
        if (Object.values(this.usedBy).length == 0) {
            // it's a root file
            await this.compile();
        }
        else {
            // it's a depend file like vars file
            for (let uri in this.usedBy) {
                this.usedBy[uri].onSave();
            }
        }
    }
    private async compile(triggerSave = true) {
        try {
            let newCompiledTxt = this.compiledTxt;

            let errorMsgTxt = "|error|";
            const _loadContent = async (file: AventusFile): Promise<string> => {
                let textToSearch = file.contentUser;
                //remove comment @import
                textToSearch = textToSearch.replace(/\/\*[\s\S]*?@import[\s\S]*?\*\/|\/\/.*@import.*/g, '');


                let regex = /@import *?('|")(\S*?)('|");?/g;
                let arrMatch: RegExpExecArray | null = null;
                while (arrMatch = regex.exec(textToSearch)) {
                    let importName = arrMatch[2];
                    let fileDependance = await this.resolvePath(importName, file.folderPath);
                    if (fileDependance) {
                        let nesteadContent = await _loadContent(fileDependance);
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
            let oneFileContent = await _loadContent(this.file);
            if (oneFileContent != "|error|") {
                try {
                    this.customProperties = AventusSCSSLanguageService.getCustomProperty(oneFileContent);
                    //remove comment 
                    oneFileContent = oneFileContent.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1');
                    let compiled = compileString(oneFileContent, {
                        style: 'compressed'
                    }).css.toString().trim();
                    compiled = compiled.replace(/\\/g, "\\\\");
                    newCompiledTxt = compiled;
                    if (this.diagnosticCompile) {
                        this.diagnosticCompile = undefined;
                        GenericServer.sendDiagnostics({ uri: this.file.uri, diagnostics: this.diagnostics }, this.build)
                    }
                } catch (e: any) {
                    if (e instanceof Exception) {
                        this.diagnosticCompile = createErrorScss(this.file.documentUser, e.message);
                        const diagnostics = [...this.diagnostics, this.diagnosticCompile];
                        GenericServer.sendDiagnostics({ uri: this.file.uri, diagnostics: diagnostics }, this.build)
                    }
                    else {
                        console.log(e);
                    }
                }
            }


            if (newCompiledTxt != this.compiledTxt) {
                this.compiledVersion++;
                this.compiledTxt = newCompiledTxt;
                if (this.isGlobal) {
                    HttpServer.getInstance().updateGlobalCSS(this.globalName, this.compiledTxt);
                    this.build.build();
                }
                else {
                    let tsFile = this.build.tsFiles[this.file.uri.replace(AventusExtension.ComponentStyle, AventusExtension.ComponentLogic)];
                    if (tsFile instanceof AventusWebComponentLogicalFile && triggerSave) {
                        tsFile.canUpdateComponent = false;
                        await tsFile.triggerSave();
                        if (tsFile.compilationResult) {
                            let namespace = this.namespace;
                            let namespaceFile = tsFile.fileParsed?.classes[tsFile.compilationResult.componentName].namespace;
                            if (namespaceFile) {
                                namespace += namespaceFile;
                            }
                            if (namespace.length > 0 && !namespace.endsWith(".")) {
                                namespace += '.';
                            }
                            HttpServer.getInstance().updateCSS(this.compiledTxt, namespace + tsFile.compilationResult.componentName, [])
                        }
                    }
                }

            }

            this._rules = this.build.scssLanguageService.getRules(this.file);
            let htmlFile = this.build.htmlFiles[this.file.uri.replace(AventusExtension.ComponentStyle, AventusExtension.ComponentView)];
            if (htmlFile instanceof AventusHTMLFile) {
                ParserHtml.refreshStyle(htmlFile, this.build);
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
        let result = await this.build.scssLanguageService.onReferences(document, position);
        result = [...result, ...this.build.scssLanguageService.getLinkToHtml(this, position)]
        return result;
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
    private async loadDependances() {
        let text = this.file.contentUser;
        let textToSearch = text.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1')
        let regex = /@import *?('|")(\S*?)('|");?/g;
        let arrMatch: RegExpExecArray | null = null;
        for (let dependanceUri in this.dependances) {
            this.removeDependance(dependanceUri);
        }
        while (arrMatch = regex.exec(textToSearch)) {
            let importName = arrMatch[2];
            let fileDependance = await this.resolvePath(importName, this.file.folderPath);
            if (!fileDependance) {
                let start = text.indexOf(arrMatch[0]);
                let end = start + arrMatch[0].length;
                this.diagnostics.push(createErrorScssPos(this.file.documentUser, "Can't load this file", start, end));
            }
            else {
                await this.addDependance(fileDependance);
            }
        }
    }

    private removeDependance(uri: string): void {
        if (this.dependances[uri]) {
            delete this.dependances[uri].usedBy[this.file.uri];
            delete this.dependances[uri];
        }
    }
    private async addDependance(fileDependance: AventusFile): Promise<void> {
        if (this.build.scssFiles[fileDependance.uri]) {
            this.dependances[fileDependance.uri] = this.build.scssFiles[fileDependance.uri];
            this.build.scssFiles[fileDependance.uri].usedBy[this.file.uri] = this;
        }
        else if (fileDependance.uri.endsWith(AventusExtension.ComponentStyle)) {
            this.build.scssFiles[fileDependance.uri] = new AventusWebSCSSFile(fileDependance, this.build);
            await this.build.scssFiles[fileDependance.uri].init();
            this.dependances[fileDependance.uri] = this.build.scssFiles[fileDependance.uri];
            this.build.scssFiles[fileDependance.uri].usedBy[this.file.uri] = this;
        }
    }

    private async getByPath(loadingPath: string): Promise<AventusFile | undefined> {
        let result: AventusFile | undefined = FilesManager.getInstance().getByPath(loadingPath);
        if (result) return result;

        if (existsSync(loadingPath) && lstatSync(loadingPath).isFile()) {
            let document = TextDocument.create(pathToUri(loadingPath), AventusLanguageId.SCSS, 1, readFileSync(loadingPath, 'utf-8'));
            await FilesManager.getInstance().registerFile(document);
            return FilesManager.getInstance().getByPath(loadingPath);
        }
        return undefined;
    }

    private async resolvePath(loadingPath: string, currentFolder: string): Promise<AventusFile | undefined> {
        loadingPath = this.build.project.resolveAlias(loadingPath, currentFolder);
        loadingPath = normalize(currentFolder + "/" + loadingPath);
        let result: AventusFile | undefined = await this.getByPath(loadingPath);
        if (result) {
            return result;
        }
        let pathWithExtension = loadingPath + AventusExtension.ComponentStyle;
        result = await this.getByPath(pathWithExtension)
        if (result) {
            return result;
        }
        let splitted = loadingPath.split(sep);
        splitted[splitted.length - 1] = "_" + splitted[splitted.length - 1];
        let pathWithUnderscore = splitted.join(sep);
        result = await this.getByPath(pathWithUnderscore)
        if (result) {
            return result;
        }
        let pathWithUnderscoreExtension = pathWithUnderscore + AventusExtension.ComponentStyle;
        result = await this.getByPath(pathWithUnderscoreExtension);
        if (result) {
            return result;
        }
        return undefined;
    }
    //#endregion
}
