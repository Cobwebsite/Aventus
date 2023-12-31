import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { EOL } from 'os';
import { Position, CompletionList, CompletionItem, Hover, Definition, Range, FormattingOptions, TextEdit, CodeAction, Diagnostic, Location, CodeLens, WorkspaceEdit } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { AventusErrorCode, AventusExtension, AventusLanguageId } from "../../../definition";
import { AventusFile, InternalAventusFile } from '../../../files/AventusFile';
import { HttpServer } from '../../../live-server/HttpServer';
import { Build } from "../../../project/Build";
import { AventusBaseFile } from "../../BaseFile";
import { AventusHTMLFile } from "../../html/File";
import { AventusWebSCSSFile } from "../../scss/File";
import { AventusTsFile } from "../File";
import { AventusWebcomponentCompiler } from "./compiler/compiler";
import { CompileComponentResult } from "./compiler/def";
import { ClassInfo } from '../parser/ClassInfo';
import { replaceNotImportAliases } from '../../../tools';
import { QuickParser } from './QuickParser';
import * as md5 from 'md5';

type ViewMethodInfo = {
    name: string
    start: number,
    fullStart: number,
    end: number,
    returnPosition: number,
    fct: {
        start: number;
        end: number;
        txt: string;
    }
}

export class AventusWebComponentLogicalFile extends AventusTsFile {
    private _compilationResult: CompileComponentResult | undefined;
    public canUpdateComponent: boolean = true;
    private viewMethodsInfo: ViewMethodInfo[] = [];

    private originalDocument!: TextDocument;
    public get compilationResult() {
        return this._compilationResult;
    }
    protected get extension(): string {
        return AventusExtension.ComponentLogic;
    }
    public get version(): number {
        return this.file.document.version;
    }

    public get HTMLFile(): AventusHTMLFile | undefined {
        if (this.file.uri.endsWith(AventusExtension.Component)) {
            return this.build.wcFiles[this.file.uri].view;
        }
        return this.build.htmlFiles[this.file.uri.replace(AventusExtension.ComponentLogic, AventusExtension.ComponentView)];
    }
    private _fullname: string = "";
    public get fullName(): string {
        return this._fullname;
    }
    public get viewMethodName(): string {
        return "__" + md5(this.fullName) + "method";
    }
    private _componentEnd: number = 0;
    public get componentEnd(): number {
        return this._componentEnd;
    }
    private _componentClassName: string = "";
    public get componentClassName(): string {
        return this._componentClassName;
    }

    public htmlDiagnostics: Diagnostic[] = [];

    constructor(file: AventusFile, build: Build) {
        super(file, build);
        this.setOriginalDocument(file.document);
    }




    private waitingFct: { [version: string]: (() => void)[] } = {};
    private mergedVersion = '-1_-1_-1';
    private isCompiling = false;
    public runWebCompiler() {
        return new Promise<void>((resolve) => {
            let version = AventusWebcomponentCompiler.getVersion(this, this.build);
            let mergedVersion = version.ts + '_' + version.scss + '_' + version.html;
            let force = this.build.insideRebuildAll;
            if (mergedVersion == this.mergedVersion && !force) {
                resolve();
            }
            else {
                if (!this.isCompiling) {
                    this.isCompiling = true;
                    this.recreateFileContent();
                    this._compilationResult = new AventusWebcomponentCompiler(this, this.build).compile();
                    this.build.scssLanguageService.addInternalDefinition(this.file.uri, this._compilationResult.scssDoc);
                    this.build.htmlLanguageService.addInternalDefinition(this.file.uri, this._compilationResult.htmlDoc, this);
                    this.isCompiling = false;
                    this.mergedVersion = mergedVersion;
                    if (this.waitingFct[mergedVersion]) {
                        for (let fct of this.waitingFct[mergedVersion]) {
                            fct();
                        }
                    }
                    resolve();
                }
                else {
                    if (!this.waitingFct[mergedVersion]) {
                        this.waitingFct[mergedVersion] = [];
                    }
                    this.waitingFct[mergedVersion].push(() => {
                        resolve();
                    })

                }
            }
        })

    }

    private lastFileVersionCreated: { html: number, js: number } = {
        html: -1,
        js: -1
    };
    public recreateFileContent() {
        let htmlFile = this.HTMLFile;
        if (htmlFile) {
            let htmlVersion = htmlFile.file.version ?? -1;
            let mustWrite = false;
            if (this.lastFileVersionCreated.js != this.originalDocument.version) {
                mustWrite = true;
            }
            else if (this.lastFileVersionCreated.html != htmlVersion) {
                mustWrite = true;
            }
            if (mustWrite) {
                this.lastFileVersionCreated = {
                    html: htmlVersion,
                    js: this.originalDocument.version
                }
                // write html fct inside js
                if (this.componentEnd >= 0) {
                    let oldContent = this.originalDocument.getText();
                    let newContent = oldContent.slice(0, this.componentEnd - 1) + "\n";

                    let methods = htmlFile.fileParsed?.fcts ?? [];
                    this.viewMethodsInfo = [];
                    for (let method of methods) {
                        method.txt = method.txt.replace(/\n/g, ";");

                        let returnPosition = -1;
                        let resultTemp: string[] = method.txt.split(";");
                        if (!method.txt.includes("return ")) {
                            if (resultTemp.length > 0) {
                                let lastEl = resultTemp.pop()
                                returnPosition = resultTemp.join("\n").length;
                                resultTemp.push("return " + lastEl);
                            }
                        }
                        method.txt = resultTemp.join("\n");

                        let fullStart = newContent.length;
                        let parameters: string[] = [];
                        for (let varName in method.variablesType) {
                            parameters.push(varName + ":" + method.variablesType[varName]);
                        }

                        newContent += `/** */\n@Effect()\npublic ${method.name}(${parameters.join(",")}): NotVoid {\n`;
                        let start = newContent.length;
                        newContent += method.txt + "\n";
                        newContent += '}' + "\n";
                        this.viewMethodsInfo.push({
                            name: method.name,
                            fullStart: fullStart,
                            start: start,
                            end: newContent.length,
                            fct: method,
                            returnPosition
                        });

                    }

                    newContent += oldContent.slice(this.componentEnd - 1);
                    let v = this.originalDocument.version + htmlVersion
                    if (this.file instanceof InternalAventusFile) {
                        this.file.setDocument(TextDocument.create(this.file.document.uri, this.file.document.languageId, v, newContent));
                    }
                    writeFileSync(this.file.path + ".ts", newContent);
                }

                this.refreshFileParsed();
            }
        }

    }

    private setOriginalDocument(document: TextDocument) {
        this.originalDocument = document;
        let quickParse = QuickParser.parse(this.originalDocument.getText(), this.build);
        this._componentEnd = quickParse.end;
        this._fullname = quickParse.fullname;
        this._componentClassName = quickParse.className;
    }

    protected async onValidate(): Promise<Diagnostic[]> {
        await this.runWebCompiler();
        this.diagnostics = this.compilationResult?.diagnostics || []
        // extract diagnostics
        this.transformDiagnosticForView();
        this.HTMLFile?.validate();
        if (this.fileParsed) {
            this.diagnostics = this.diagnostics.concat(this.fileParsed.errors)
        }
        return this.diagnostics;
    }
    protected transformDiagnosticForView() {
        let html = this.HTMLFile;
        if (html) {
            let jsDiags: Diagnostic[] = [];
            let htmlDiags: Diagnostic[] = [];
            let convertedRanges: Range[] = [];
            for (let diagnostic of this.diagnostics) {
                let diagStart = this.file.document.offsetAt(diagnostic.range.start);
                let diagEnd = this.file.document.offsetAt(diagnostic.range.end);
                let found = false;
                for (let i = 0; i < this.viewMethodsInfo.length; i++) {
                    let start = this.viewMethodsInfo[i].fullStart;
                    let end = this.viewMethodsInfo[i].end;

                    if (diagStart > start && diagEnd < end) {
                        // it's inside the {{ }}
                        diagnostic.source = AventusLanguageId.HTML;
                        let methodView = this.viewMethodsInfo[i].fct;

                        if (convertedRanges.indexOf(diagnostic.range) == -1) {
                            let offsetReturn = 0;
                            if (diagStart > this.viewMethodsInfo[i].returnPosition) {
                                offsetReturn = 7;
                            }
                            convertedRanges.push(diagnostic.range);
                            let offsetStart = diagStart - this.viewMethodsInfo[i].start - offsetReturn;
                            let offsetEnd = diagEnd - this.viewMethodsInfo[i].start - offsetReturn;

                            let finalPositionStart = methodView.start + 2 + offsetStart;
                            let finalPositionEnd = methodView.start + 2 + offsetEnd;
                            if (finalPositionStart < methodView.start || finalPositionEnd > methodView.end - 2) {
                                diagnostic.range.start = html.file.document.positionAt(methodView.start);
                                diagnostic.range.end = html.file.document.positionAt(methodView.end);
                            }
                            else {
                                diagnostic.range.start = html.file.document.positionAt(finalPositionStart);
                                diagnostic.range.end = html.file.document.positionAt(finalPositionEnd);
                            }
                        }
                        found = true;

                        break;
                    }
                }

                if (found) {
                    htmlDiags.push(diagnostic);
                }
                else {
                    jsDiags.push(diagnostic);
                }
            }
            this.diagnostics = jsDiags;
            this.htmlDiagnostics = htmlDiags;
        }
        else {
            this.htmlDiagnostics = [];
        }
    }

    protected async onContentChange(): Promise<void> {
        this.setOriginalDocument(this.file.document);
        await this.runWebCompiler();
    }
    protected async onSave() {
        await this.runWebCompiler();
        if (this.compilationResult) {
            this.setCompileResult(this.compilationResult.result);
        }
        else {
            this.setCompileResult([]);
        }
        if (this.compilationResult?.writeCompiled) {
            writeFileSync(this.file.folderPath + '/compiled.js', replaceNotImportAliases(this.compilationResult.debug, this.build.project.getConfig()));
        }
        else if (existsSync(this.file.folderPath + '/compiled.js')) {
            unlinkSync(this.file.folderPath + '/compiled.js')
        }
        if (!this.canUpdateComponent) {
            this.canUpdateComponent = true;
        }
    }
    protected emitToHtttpServer(oldBuildInfo: { name: string; src: string; }[]): void {
        if (!this.canUpdateComponent) {
            return;
        }
        let oldInfo: { [name: string]: string } = {}
        for (let old of oldBuildInfo) {
            oldInfo[old.name] = old.src;
        }
        let reloadComp = false;
        let srcToUpdate = "";
        let compName = "";
        let classInfo: ClassInfo | undefined = undefined;
        if (this.compilationResult) {
            for (let result of this.compileResult) {
                if (result.classScript != "" && oldInfo[result.classScript]) {
                    if (oldInfo[result.classScript] != result.compiled) {
                        if (result.classScript != this.compilationResult.componentName) {
                            this.build.reloadPage = true;
                        }
                        else {
                            reloadComp = true;
                            srcToUpdate = result.compiled;
                            compName = result.classScript;
                            classInfo = this.fileParsed?.classes[compName]
                        }
                    }
                }
            }
        }
        if (!this.build.reloadPage && reloadComp && classInfo) {
            srcToUpdate = srcToUpdate.slice(srcToUpdate.indexOf("="));
            srcToUpdate = srcToUpdate.replace(/if\(\!window\.customElements\.get\(.*$/gm, '');

            let namespace = this.buildNamespace;
            if (classInfo.namespace) {
                namespace += classInfo.namespace;
            }
            if (namespace.length > 0 && !namespace.endsWith(".")) {
                namespace += '.';
            }
            HttpServer.getInstance().updateComponent(srcToUpdate, namespace + compName, []);
        }
    }
    protected async onDelete(): Promise<void> {
        await super.onDelete();
        this.build.scssLanguageService.removeInternalDefinition(this.file.uri);
        this.build.htmlLanguageService.removeInternalDefinition(this.file.uri);

    }

    public async doViewCompletion(htmlPosition: Position): Promise<CompletionList | null> {
        const html = this.HTMLFile;
        if (!html) {
            return null;
        }
        let offsetFrom = html.file.document.offsetAt(htmlPosition);
        for (let viewMethodInfo of this.viewMethodsInfo) {
            if (offsetFrom >= viewMethodInfo.fct.start + 2 && offsetFrom <= viewMethodInfo.fct.end) {
                let offset = offsetFrom - viewMethodInfo.fct.start - 2;
                let offsetOnFile = viewMethodInfo.start + offset;
                if (offsetOnFile >= viewMethodInfo.returnPosition) {
                    offsetOnFile += 7
                }
                let positionOnFile = this.file.document.positionAt(offsetOnFile);
                let resultTemp = await this.onCompletion(this.file, positionOnFile);
                let result: CompletionItem[] = [];
                let convertedRanges: Range[] = [];
                for (let item of resultTemp.items) {
                    if (this.viewMethodName && item.label.startsWith(this.viewMethodName)) {
                        continue
                    }
                    if (item.data && item.data.uri) {
                        item.data.languageId = AventusLanguageId.HTML;
                        item.data.uri = html.file.uri;
                    }
                    if (item.textEdit) {
                        let textEdit = item.textEdit as TextEdit;
                        if (textEdit.range) {
                            if (convertedRanges.indexOf(textEdit.range) == -1) {
                                convertedRanges.push(textEdit.range);
                                let methodView = viewMethodInfo.fct;
                                let textEditStart = this.file.document.offsetAt(textEdit.range.start);
                                let textEditEnd = this.file.document.offsetAt(textEdit.range.end);

                                let offsetReturn = 0;
                                if (textEditStart > viewMethodInfo.returnPosition) {
                                    offsetReturn = 7;
                                }
                                let offsetStart = textEditStart - viewMethodInfo.start - offsetReturn;
                                let offsetEnd = textEditEnd - viewMethodInfo.start - offsetReturn;

                                textEdit.range.start = html.file.document.positionAt(methodView.start + 2 + offsetStart);
                                textEdit.range.end = html.file.document.positionAt(methodView.start + 2 + offsetEnd);

                            }
                        }
                    }
                    result.push(item);
                }
                resultTemp.items = result;
                return resultTemp
            }
        }
        return null;
    }
    protected onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
        return this.tsLanguageService.doComplete(document, position);
    }
    protected onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem> {
        return this.tsLanguageService.doResolve(item);
    }

    public async doHover(htmlPosition: Position): Promise<Hover | null> {
        const html = this.HTMLFile;
        if (!html) {
            return null;
        }
        let offsetFrom = html.file.document.offsetAt(htmlPosition);
        for (let viewMethodInfo of this.viewMethodsInfo) {
            if (offsetFrom >= viewMethodInfo.fct.start + 2 && offsetFrom <= viewMethodInfo.fct.end) {
                let offset = offsetFrom - viewMethodInfo.fct.start - 2;
                let offsetOnFile = viewMethodInfo.start + offset;
                if (offsetOnFile >= viewMethodInfo.returnPosition) {
                    offsetOnFile += 7
                }
                let positionOnFile = this.file.document.positionAt(offsetOnFile);
                let resultTemp = await this.onHover(this.file, positionOnFile);
                if (resultTemp && resultTemp.range) {

                    let methodView = viewMethodInfo.fct;
                    let textEditStart = this.file.document.offsetAt(resultTemp.range.start);
                    let textEditEnd = this.file.document.offsetAt(resultTemp.range.end);

                    let offsetReturn = 0;
                    if (textEditStart > viewMethodInfo.returnPosition) {
                        offsetReturn = 7;
                    }
                    let offsetStart = textEditStart - viewMethodInfo.start - offsetReturn;
                    let offsetEnd = textEditEnd - viewMethodInfo.start - offsetReturn;

                    resultTemp.range.start = html.file.document.positionAt(methodView.start + 2 + offsetStart);
                    resultTemp.range.end = html.file.document.positionAt(methodView.start + 2 + offsetEnd);

                }
                return resultTemp;
            }
        }
        return null;
    }
    protected onHover(document: AventusFile, position: Position): Promise<Hover | null> {
        return this.tsLanguageService.doHover(document, position);
    }

    public async doDefinition(htmlPosition: Position): Promise<Definition | null> {
        const html = this.HTMLFile;
        if (!html) {
            return null;
        }
        let offsetFrom = html.file.document.offsetAt(htmlPosition);
        for (let viewMethodInfo of this.viewMethodsInfo) {
            if (offsetFrom >= viewMethodInfo.fct.start + 2 && offsetFrom <= viewMethodInfo.fct.end) {
                let offset = offsetFrom - viewMethodInfo.fct.start - 2;
                let offsetOnFile = viewMethodInfo.start + offset;
                if (offsetOnFile >= viewMethodInfo.returnPosition) {
                    offsetOnFile += 7
                }
                let positionOnFile = this.file.document.positionAt(offsetOnFile);
                let resultTemp = await this.onDefinition(this.file, positionOnFile);
                return resultTemp;
            }
        }
        return null;
    }
    protected onDefinition(document: AventusFile, position: Position): Promise<Definition | null> {
        return this.tsLanguageService.findDefinition(document, position);
    }

    protected async onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
        let result = await this.tsLanguageService.format(document, range, options);
        for (let i = 0; i < result.length; i++) {
            let format = result[i];
            let formatStart = this.file.document.offsetAt(format.range.start);
            let formatEnd = this.file.document.offsetAt(format.range.end);
            for (let viewMethodInfo of this.viewMethodsInfo) {
                let start = viewMethodInfo.fullStart;
                let end = viewMethodInfo.end;
                if (formatStart > start && formatEnd < end) {
                    result.splice(i, 1);
                    i--;
                    break;
                }
            }
        }
        return result;
    }
    protected async onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
        let actions = await this.tsLanguageService.doCodeAction(document, range);
        this.addCustomCodeAction(actions);
        return actions;
    }

    public async doReferences(htmlPosition: Position): Promise<Location[] | null> {
        const html = this.HTMLFile;
        if (!html) {
            return null;
        }
        let offsetFrom = html.file.document.offsetAt(htmlPosition);
        for (let viewMethodInfo of this.viewMethodsInfo) {
            if (offsetFrom >= viewMethodInfo.fct.start + 2 && offsetFrom <= viewMethodInfo.fct.end) {
                let offset = offsetFrom - viewMethodInfo.fct.start - 2;
                let offsetOnFile = viewMethodInfo.start + offset;
                if (offsetOnFile >= viewMethodInfo.returnPosition) {
                    offsetOnFile += 7
                }
                let positionOnFile = this.file.document.positionAt(offsetOnFile);
                let resultTemps = await this.onReferences(this.file, positionOnFile);
                return resultTemps;
            }
        }
        return null;
    }
    protected async onReferences(document: AventusFile, position: Position): Promise<Location[]> {
        let locationsHTML: Location[] = []
        let locationsTs = await this.tsLanguageService.onReferences(document, position) || [];
        if (this._compilationResult?.componentName && this.fileParsed?.classes[this._compilationResult.componentName]) {
            let offset = this.file.document.offsetAt(position);
            let classParsed = this.fileParsed?.classes[this._compilationResult.componentName];
            if (offset >= classParsed.nameStart && offset <= classParsed.nameEnd) {
                for (let [file, positions] of this.reverseViewClassInfoDependances) {
                    for (let position of positions) {
                        locationsHTML.push({
                            uri: file.file.uri,
                            range: {
                                start: file.file.document.positionAt(position.start),
                                end: file.file.document.positionAt(position.end),
                            }
                        })
                    }
                }
            }
        }
        let locations = [...locationsTs, ...locationsHTML];
        this.transformRefrencesToView(locations);
        return locations;
    }

    protected transformRefrencesToView(locations: Location[]) {
        for (let location of locations) {
            if (location.uri.endsWith(AventusExtension.ComponentLogic)) {
                let file = this.build.tsFiles[location.uri];
                if (!file) {
                    continue;
                }

                if (file instanceof AventusWebComponentLogicalFile) {
                    let html = file.HTMLFile;
                    if (html) {
                        let convertedRanges: Range[] = [];
                        let diagStart = file._file.document.offsetAt(location.range.start);
                        let diagEnd = file._file.document.offsetAt(location.range.end);
                        for (let i = 0; i < this.viewMethodsInfo.length; i++) {
                            let start = this.viewMethodsInfo[i].fullStart;
                            let end = this.viewMethodsInfo[i].end;

                            if (diagStart > start && diagEnd < end) {
                                // it's inside the {{ }}
                                location.uri = html.file.uri;
                                let methodView = this.viewMethodsInfo[i].fct;

                                if (convertedRanges.indexOf(location.range) == -1) {
                                    let offsetReturn = 0;
                                    if (diagStart > this.viewMethodsInfo[i].returnPosition) {
                                        offsetReturn = 7;
                                    }
                                    convertedRanges.push(location.range);
                                    let offsetStart = diagStart - this.viewMethodsInfo[i].start - offsetReturn;
                                    let offsetEnd = diagEnd - this.viewMethodsInfo[i].start - offsetReturn;

                                    let finalPositionStart = methodView.start + 2 + offsetStart;
                                    let finalPositionEnd = methodView.start + 2 + offsetEnd;
                                    if (finalPositionStart < methodView.start || finalPositionEnd > methodView.end - 2) {
                                        location.range.start = html.file.document.positionAt(methodView.start);
                                        location.range.end = html.file.document.positionAt(methodView.end);
                                    }
                                    else {
                                        location.range.start = html.file.document.positionAt(finalPositionStart);
                                        location.range.end = html.file.document.positionAt(finalPositionEnd);
                                    }
                                }
                                break;
                            }
                        }
                    }

                }
            }
        }
    }


    protected async onCodeLens(document: AventusFile): Promise<CodeLens[]> {
        return this.tsLanguageService.onCodeLens(document);
    }

    public async doRename(htmlPosition: Position, newName: string): Promise<WorkspaceEdit | null> {
        const html = this.HTMLFile;
        if (!html) {
            return null;
        }
        let offsetFrom = html.file.document.offsetAt(htmlPosition);
        for (let viewMethodInfo of this.viewMethodsInfo) {
            if (offsetFrom >= viewMethodInfo.fct.start + 2 && offsetFrom <= viewMethodInfo.fct.end) {
                let offset = offsetFrom - viewMethodInfo.fct.start - 2;
                let offsetOnFile = viewMethodInfo.start + offset;
                if (offsetOnFile >= viewMethodInfo.returnPosition) {
                    offsetOnFile += 7
                }
                let positionOnFile = this.file.document.positionAt(offsetOnFile);
                let resultTemps = await this.onRename(this.file, positionOnFile, newName);
                return resultTemps;
            }
        }
        return null;
    }
    protected async onRename(document: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null> {
        let result = await this.tsLanguageService.onRename(document, position, newName);
        if (result) {
            this.transformRenameToView(result);
        }
        return result;
    }
    protected transformRenameToView(workspaceEdit: WorkspaceEdit) {
        if (workspaceEdit.changes) {
            let toAdd: { [uri: string]: TextEdit[] } = {}
            for (let uri in workspaceEdit.changes) {
                if (uri.endsWith(AventusExtension.ComponentLogic)) {
                    let changes = workspaceEdit.changes[uri];
                    let file = this.build.tsFiles[uri];
                    if (!file) {
                        continue;
                    }

                    if (file instanceof AventusWebComponentLogicalFile) {
                        let html = file.HTMLFile;
                        if (html) {
                            for (let j = 0; j < changes.length; j++) {
                                let change = changes[j];
                                let diagStart = file._file.document.offsetAt(change.range.start);
                                let diagEnd = file._file.document.offsetAt(change.range.end);
                                for (let i = 0; i < this.viewMethodsInfo.length; i++) {
                                    let start = this.viewMethodsInfo[i].fullStart;
                                    let end = this.viewMethodsInfo[i].end;

                                    if (diagStart > start && diagEnd < end) {
                                        // it's inside the {{ }}
                                        if (!toAdd[html.file.uri]) {
                                            toAdd[html.file.uri] = [];
                                        }
                                        let methodView = this.viewMethodsInfo[i].fct;

                                        let offsetReturn = 0;
                                        if (diagStart > this.viewMethodsInfo[i].returnPosition) {
                                            offsetReturn = 7;
                                        }

                                        let offsetStart = diagStart - this.viewMethodsInfo[i].start - offsetReturn;
                                        let offsetEnd = diagEnd - this.viewMethodsInfo[i].start - offsetReturn;

                                        let finalPositionStart = methodView.start + 2 + offsetStart;
                                        let finalPositionEnd = methodView.start + 2 + offsetEnd;

                                        toAdd[html.file.uri].push({
                                            newText: change.newText,
                                            range: {
                                                start: html.file.document.positionAt(finalPositionStart),
                                                end: html.file.document.positionAt(finalPositionEnd)
                                            }
                                        });

                                        changes.splice(j, 1);
                                        j--;
                                        break;
                                    }
                                }
                            }
                        }

                    }
                }
            }

            for (let uri in toAdd) {
                if (!workspaceEdit.changes[uri]) {
                    workspaceEdit.changes[uri] = toAdd[uri];
                }
                else {
                    for (let textEdit of toAdd[uri]) {
                        workspaceEdit.changes[uri].push(textEdit);
                    }
                }
            }
        }
    }

    private addCustomCodeAction(actions: CodeAction[]) {
        let missingView = false;
        let missingMethod = false;
        for (let diagnostic of this.diagnostics) {
            if (diagnostic.code == AventusErrorCode.MissingViewElement && !missingView) {
                missingView = true;
                actions.push({
                    title: "Import missing view elements",
                    command: {
                        command: "aventus.wc.import.viewElement",
                        title: "Import missing view elements"
                    }
                })
            }
            else if (diagnostic.code == AventusErrorCode.MissingProp) {
                let propName = diagnostic.message.match(/#[a-zA-Z0-9_]+/g);
                if (propName) {
                    let propTxt = propName[0].replace("#", "");
                    actions.push({
                        title: "Import missing property " + propTxt,
                        command: {
                            command: "aventus.wc.create.property",
                            title: "Create property",
                            arguments: ["prefill:" + propTxt]
                        }
                    })
                }
            }
            else if (diagnostic.code == AventusErrorCode.MissingMethod && !missingMethod) {
                missingMethod = true;
                actions.push({
                    title: "Import missing methods",
                    command: {
                        command: "aventus.wc.import.viewMethod",
                        title: "Import missing methods"
                    }
                })
            }
            else if (diagnostic.code == AventusErrorCode.viewElementNotFound) {
                if (diagnostic.data) {
                    let data = diagnostic.data as { start: number, end: number };
                    actions.push({
                        title: "Remove element",
                        edit: {
                            changes: {
                                [this.file.uri]: [{
                                    newText: "",
                                    range: {
                                        start: this.file.document.positionAt(data.start),
                                        end: this.file.document.positionAt(data.end),
                                    }
                                }]
                            }
                        }
                    })
                }
            }
        }
    }

    public getMissingVariablesInfo(): { start: number, text: string } {
        let result = "";
        let position = -1;
        if (this.compilationResult) {
            position = this.compilationResult?.missingViewElements.position;
            for (let name in this.compilationResult.missingViewElements.elements) {
                result += "@ViewElement()" + EOL + "protected " + name + "!: " + this.compilationResult.missingViewElements.elements[name] + ";" + EOL
            }
        }
        if (result != "") {
            result = EOL + result;
        }
        return {
            start: position,
            text: result
        };
    }
    public getMissingMethodsInfo(): { start: number, text: string } {
        let result = "";
        let position = -1;
        if (this.compilationResult) {
            position = this.compilationResult?.missingMethods.position;
            for (let name of this.compilationResult.missingMethods.elements) {
                result += `/**${EOL} * ${EOL} */${EOL}protected ${name}(){${EOL}throw new Error("Method not implemented.");${EOL}}${EOL}`;
            }
        }
        if (result != "") {
            result = EOL + result;
        }
        return {
            start: position,
            text: result
        };
    }
    /**
     * Get the class name
     */
    public getComponentName(): string {
        return this.compilationResult?.componentName || '';
    }

    // view dependances
    private viewClassInfoDependances: AventusTsFile[] = [];
    private reverseViewClassInfoDependances: Map<AventusHTMLFile, { start: number, end: number }[]> = new Map();

    public resetViewClassInfoDep() {
        let htmlFile = this.HTMLFile;
        if (!htmlFile) {
            return;
        }
        for (let dep of this.viewClassInfoDependances) {
            if (dep instanceof AventusWebComponentLogicalFile) {
                dep.reverseViewClassInfoDependances.delete(htmlFile);
            }
        }
        this.viewClassInfoDependances = [];
    }
    public addViewClassInfoDep(file: AventusTsFile, start: number, end: number) {
        let htmlFile = this.HTMLFile;
        if (!htmlFile) {
            return;
        }
        if (!this.viewClassInfoDependances.includes(file)) {
            this.viewClassInfoDependances.push(file);
        }

        if (file instanceof AventusWebComponentLogicalFile) {
            if (!file.reverseViewClassInfoDependances.has(htmlFile)) {
                file.reverseViewClassInfoDependances.set(htmlFile, []);
            }
            file.reverseViewClassInfoDependances.get(htmlFile)?.push({ start, end });
        }
    }

}

