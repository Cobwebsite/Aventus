import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { EOL } from 'os';
import { Position, CompletionList, CompletionItem, Hover, Definition, Range, FormattingOptions, TextEdit, CodeAction, Diagnostic, Location, CodeLens, WorkspaceEdit } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { AventusErrorCode, AventusExtension, AventusLanguageId } from "../../../definition";
import { AventusFile, InternalAventusFile } from '../../../files/AventusFile';
import { HttpServer } from '../../../live-server/HttpServer';
import { Build } from "../../../project/Build";
import { AventusHTMLFile } from "../../html/File";
import { AventusTsFile } from "../File";
import { AventusWebcomponentCompiler } from "./compiler/compiler";
import { CompileComponentResult } from "./compiler/def";
import { ClassInfo } from '../parser/ClassInfo';
import { replaceNotImportAliases } from '../../../tools';
import { QuickParser } from './QuickParser';
import * as md5 from 'md5';
import { HTMLFormat } from '../../html/parser/definition';
import { join } from 'path';
import { InjectionRender } from '../../html/parser/TagInfo';

type ViewMethodInfo = {
    name: string
    start: number,
    offsetBefore: number
    offsetAfter: number
    fullStart: number,
    end: number,
    transform: (start: number, currentPos: number) => number
    fct: {
        positions: {
            start: number,
            end: number,
        }[]
        txt: string;
    }
    kind: 'fct' | 'loop' | 'if' | 'context'
}

export class AventusWebComponentLogicalFile extends AventusTsFile {
    private _compilationResult: CompileComponentResult | undefined;
    public canUpdateComponent: boolean = true;
    private viewMethodsInfo: ViewMethodInfo[] = [];

    // private originalDocument!: TextDocument;
    // private originalDocumentVersion: number = 0;
    public get compilationResult() {
        return this._compilationResult;
    }
    protected get extension(): string {
        return AventusExtension.ComponentLogic;
    }
    public get version(): number {
        return this.file.documentInternal.version;
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
    private _space: string = "";
    private writeHtml: boolean = false;
    private writeTs: boolean = false;

    public htmlDiagnostics: Diagnostic[] = [];

    constructor(file: AventusFile, build: Build) {
        super(file, build);
        file.linkInternalAndUser = false;
        this.quickParse();
        // refresh file parsed on load to have default content without view function so that others files can have dependance
        this.refreshFileParsed();
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
    private typeInfered: { [name: string]: string } = {};
    public recreateFileContent() {
        let htmlFile = this.HTMLFile;
        if (htmlFile) {
            let htmlVersion = htmlFile.file.versionUser ?? -1;
            let mustWrite = false;
            let tsIsDiff = false;
            if (this.lastFileVersionCreated.js != this.file.documentUser.version) {
                mustWrite = true;
                tsIsDiff = true;
            }
            else if (this.lastFileVersionCreated.html != htmlVersion) {
                mustWrite = true;
            }
            if (mustWrite) {
                this.lastFileVersionCreated = {
                    html: htmlVersion,
                    js: this.file.documentUser.version
                }
                let newContent = "";
                // write html fct inside js
                if (this.componentEnd >= 0) {
                    let v = this.file.documentUser.version + htmlVersion + 1 // use +1 to allow version to be bigger than 0 at start
                    let oldContent = this.file.documentUser.getText();
                    newContent = oldContent.slice(0, this.componentEnd - 1) + "\n";

                    this.viewMethodsInfo = [];
                    let returnAddedLength = 0;

                    const getParameters = (variables: string[]) => {
                        let parameters: string[] = [];
                        for (let variable of variables) {
                            let type = this.typeInfered[variable] ?? "any";
                            parameters.push(variable + ":" + type);
                        }
                        return parameters;
                    }

                    if (tsIsDiff) {
                        // if the typescript, maybe the type of the loop changed => we must reinfered all types
                        const inferForType = () => {
                            if (!htmlFile) return;
                            let fors = htmlFile.fileParsed?.loops ?? [];
                            let i = 0;
                            for (let _for of fors) {
                                let parameters: string[] = getParameters(_for.variables);
                                let tempContent = newContent;
                                tempContent += `/** */\n@NoCompile()\nprivate ${_for.loopName}(${parameters.join(",")}): void {\n`;
                                let start = tempContent.length;
                                tempContent += _for.loopTxt + "\n";
                                tempContent += '}\n';
                                // close the class
                                tempContent += '}';
                                if (this.file instanceof InternalAventusFile) {
                                    this.file.setDocumentInternal(TextDocument.create(this.file.documentUser.uri, this.file.documentUser.languageId, (v + i) * -1, tempContent));
                                    this._contentForLanguageService = tempContent;
                                }

                                for (let info of _for.typeToLoad) {
                                    let center = Math.floor((info.start + info.end) / 2);
                                    let diff = center - _for.start;
                                    let position = start + diff;
                                    let text = _for.loopTxt.slice(info.start - _for.start, info.end - _for.start)
                                    let typeName = this.tsLanguageService.getType(this.file, position) ?? "any";
                                    this.typeInfered[text] = typeName;
                                }

                                i++;
                            }

                            let edits = htmlFile.fileParsed?.contextEdits ?? [];
                            for (let edit of edits) {
                                let parameters: string[] = getParameters(edit.variables);
                                let tempContent = newContent;
                                tempContent += `/** */\n@NoCompile()\nprivate ${edit.editName}(${parameters.join(",")}): void {\n`;
                                let start = tempContent.length;
                                tempContent += edit.fctTs + "\n";
                                tempContent += '}\n';
                                // close the class
                                tempContent += '}';

                                if (this.file instanceof InternalAventusFile) {
                                    this.file.setDocumentInternal(TextDocument.create(this.file.documentUser.uri, this.file.documentUser.languageId, (v + i) * -1, tempContent));
                                    this._contentForLanguageService = tempContent;
                                }

                                for (let info of edit.typeToLoad) {
                                    let center = Math.floor((info.start + info.end) / 2);
                                    let diff = center - edit.start;
                                    let position = start + diff;
                                    let typeName = this.tsLanguageService.getType(this.file, position) ?? "any";
                                    this.typeInfered[info.txt] = typeName;
                                }
                            }


                        }
                        inferForType();
                    }

                    let fors = htmlFile.fileParsed?.loops ?? [];
                    for (let _for of fors) {
                        let fullStart = newContent.length;
                        let parameters: string[] = getParameters(_for.variables);

                        let t = this._space;
                        newContent += `${t}/** */\n${t}@NoCompile()\n${t}private ${_for.loopName}(${parameters.join(",")}): void {\n`;
                        let start = newContent.length;
                        newContent += _for.loopTxt + "\n";
                        let end = newContent.length;
                        newContent += t + '}\n';

                        const wrapper = function () {
                            let result: ViewMethodInfo = {
                                name: _for.loopName,
                                fullStart: fullStart,
                                start: start,
                                end: end,
                                offsetBefore: 0,
                                offsetAfter: 0,
                                kind: "loop",
                                fct: {
                                    txt: _for.loopTxt,
                                    positions: [{
                                        start: _for.start,
                                        end: _for.startBlock
                                    }]
                                },
                                transform(start, currentPos) {
                                    return currentPos;
                                }
                            }
                            return result;
                        }
                        this.viewMethodsInfo.push(wrapper());


                        if (!_for.isSimple) {
                            newContent += `${t}/** */\n${t}private ${_for.complex.loopName}(${parameters.join(",")}) {\n
                                ${_for.complex.init.join(";\n")}
                                return {
                                    transform:() => {
                                        ${_for.complex.transform.join(";\n")}
                                    },
                                    condition: () => {
                                        return (${_for.complex.condition})
                                    },
                                    apply: () => {
                                        return ({${_for.complex.apply}})
                                    }
                                }
                            }`
                        }
                    }

                    let methods = htmlFile.fileParsed?.fcts ?? {};
                    for (let method of Object.values(methods)) {
                        let methodTxt = method.txt.replace(/\n/g, ";");

                        let returnPosition = -1;

                        let resultTemp: string[] = methodTxt.split(";");
                        if (!methodTxt.includes("return ")) {
                            // TODO correct the return to get only the last none empty lane
                            if (resultTemp.length > 0) {
                                let lastEl = resultTemp.pop()
                                returnPosition = resultTemp.join("\n").length;
                                if (lastEl?.startsWith(" ")) {
                                    resultTemp.push("return" + lastEl);
                                    returnAddedLength = "return".length
                                }
                                else {
                                    resultTemp.push("return " + lastEl);
                                    returnAddedLength = "return ".length
                                }

                            }
                        }
                        methodTxt = resultTemp.join("\n");

                        let fullStart = newContent.length;
                        let parameters: string[] = getParameters(method.variables);

                        let resultType = 'NotVoid';

                        // TODO correct indentation
                        let t = this._space;
                        newContent += `${t}/** */\n${t}private ${method.name}(${parameters.join(",")}): ${resultType} {\n`;
                        let start = newContent.length;
                        newContent += methodTxt + "\n";
                        let end = newContent.length;
                        newContent += t + '}\n';


                        const wrapper = function (rPos: number, returnLength: number) {
                            let result: ViewMethodInfo = {
                                name: method.name,
                                fullStart: fullStart,
                                start: start,
                                end: end,
                                fct: method,
                                offsetBefore: "{{".length,
                                offsetAfter: "}}".length,
                                kind: "fct",
                                transform(start, currentPos) {
                                    if (start >= rPos) {
                                        currentPos += returnLength;
                                    }
                                    return currentPos;
                                },
                            }
                            return result;
                        }
                        this.viewMethodsInfo.push(wrapper(returnPosition, returnAddedLength));

                    }

                    let ifs = htmlFile.fileParsed?.ifs ?? [];
                    for (let _if of ifs) {

                        for (let condition of _if.conditions) {
                            let conditionTxt = condition.txt.replace(/\n/g, ";");

                            let returnPosition = -1;

                            let resultTemp: string[] = conditionTxt.split(";");
                            if (!conditionTxt.includes("return ")) {
                                // TODO correct the return to get only the last none empty lane
                                if (resultTemp.length > 0) {
                                    let lastEl = resultTemp.pop()
                                    returnPosition = resultTemp.join("\n").length;
                                    if (lastEl?.startsWith(" ")) {
                                        resultTemp.push("return" + lastEl);
                                        returnAddedLength = "return".length
                                    }
                                    else {
                                        resultTemp.push("return " + lastEl);
                                        returnAddedLength = "return ".length
                                    }

                                }
                            }
                            conditionTxt = resultTemp.join("\n");

                            let fullStart = newContent.length;

                            let parameters: string[] = getParameters(condition.variables);
                            // TODO correct indentation
                            let t = this._space;
                            newContent += `${t}/** */\n${t}private ${condition.fctName}(${parameters.join(",")}): NotVoid {\n`;
                            let start = newContent.length;
                            newContent += conditionTxt + "\n";
                            let end = newContent.length;
                            newContent += t + '}\n';

                            const wrapper = function (rPos: number, returnLength: number) {
                                let result: ViewMethodInfo = {
                                    name: condition.fctName,
                                    fullStart: fullStart,
                                    start: start,
                                    end: end,
                                    kind: "if",
                                    fct: {
                                        positions: [{ start: condition.start, end: condition.end }],
                                        txt: conditionTxt
                                    },
                                    offsetBefore: condition.offsetBefore,
                                    offsetAfter: condition.offsetAfter,
                                    transform(start, currentPos) {
                                        if (start >= rPos) {
                                            currentPos += returnLength;
                                        }
                                        return currentPos;
                                    },
                                }
                                return result;
                            }
                            this.viewMethodsInfo.push(wrapper(returnPosition, returnAddedLength));
                        }

                    }

                    let edits = htmlFile.fileParsed?.contextEdits ?? [];
                    for (let edit of edits) {
                        let fullStart = newContent.length;
                        let parameters: string[] = getParameters(edit.variables);

                        let t = this._space;
                        newContent += `${t}/** */\n${t}private ${edit.editName}(${parameters.join(",")}): { [key: string]: any } {\n`;
                        let start = newContent.length;
                        newContent += edit.fctTs + "\n";
                        let end = newContent.length;
                        newContent += t + '}\n';

                        const wrapper = function () {
                            let result: ViewMethodInfo = {
                                name: edit.editName,
                                fullStart: fullStart,
                                start: start,
                                end: end,
                                offsetBefore: 0,
                                offsetAfter: 0,
                                kind: "context",
                                fct: {
                                    txt: edit.fctTs,
                                    positions: [{
                                        start: edit.start,
                                        end: edit.end
                                    }]
                                },
                                transform(start, currentPos) {
                                    return currentPos;
                                }
                            }
                            return result;
                        }
                        this.viewMethodsInfo.push(wrapper());
                    }

                    const writeInjection = (injection: InjectionRender) => {
                        let injectionTxt = injection.injectTsTxt.replace(/\n/g, ";");
                        let returnPosition = -1;

                        let resultTemp: string[] = injectionTxt.split(";");
                        if (!injectionTxt.includes("return ")) {
                            // TODO correct the return to get only the last none empty lane
                            if (resultTemp.length > 0) {
                                let lastEl = resultTemp.pop()
                                returnPosition = resultTemp.join("\n").length;
                                if (lastEl?.startsWith(" ")) {
                                    resultTemp.push("return" + lastEl);
                                    returnAddedLength = "return".length
                                }
                                else {
                                    resultTemp.push("return " + lastEl);
                                    returnAddedLength = "return ".length
                                }

                            }
                        }
                        injectionTxt = resultTemp.join("\n");

                        let fullStart = newContent.length;
                        let parameters: string[] = getParameters(injection.variables);

                        // TODO correct indentation
                        let t = this._space;
                        newContent += `${t}/** */\n${t}private ${injection.injectFctName}(${parameters.join(",")}): NotVoid {\n`;
                        let start = newContent.length;
                        newContent += injectionTxt + "\n";
                        let end = newContent.length;
                        newContent += t + '}\n';


                        const wrapper = function (rPos: number, returnLength: number) {
                            let result: ViewMethodInfo = {
                                name: injection.injectFctName,
                                fullStart: fullStart,
                                start: start,
                                end: end,
                                fct: {
                                    txt: injection.injectTsTxt,
                                    positions: [{
                                        start: injection.start,
                                        end: injection.end
                                    }]
                                },
                                offsetBefore: '"'.length,
                                offsetAfter: '"'.length,
                                kind: "fct",
                                transform(start, currentPos) {
                                    if (start >= rPos) {
                                        currentPos += returnLength;
                                    }
                                    return currentPos;
                                },
                            }
                            return result;
                        }
                        this.viewMethodsInfo.push(wrapper(returnPosition, returnAddedLength));

                    }
                    let injections = htmlFile.fileParsed?.injections ?? [];
                    for (let injection of injections) {
                        writeInjection(injection);
                    }

                    let bindings = htmlFile.fileParsed?.bindings ?? [];
                    for (let binding of bindings) {
                        writeInjection(binding);
                        let extractTxt: string;
                        let parameters: string[] = getParameters(binding.variables);

                        let iParam = 0;
                        let setVar = "v";
                        while (binding.variables.includes(setVar)) {
                            iParam++;
                            setVar = "v" + iParam;
                        }

                        parameters = [setVar + ": any"].concat(parameters);

                        if (binding.extractTsCond.length == 0) {
                            extractTxt = binding.extractTsTxt.replace(/\n/g, ";") + " = " + setVar;
                        }
                        else {
                            extractTxt = "if( " + binding.extractTsCond + " ) { " + binding.extractTsTxt.replace(/\n/g, ";") + " = " + setVar + " }";
                        }

                        // TODO correct indentation
                        let t = this._space;
                        newContent += `${t}/** */\n${t}private ${binding.extractFctName}(${parameters.join(",")}): void {\n`;
                        let start = newContent.length;
                        newContent += extractTxt + "\n";
                        let end = newContent.length;
                        newContent += t + '}\n';
                    }

                    newContent += oldContent.slice(this.componentEnd - 1);
                    if (this.file instanceof InternalAventusFile) {
                        this.file.setDocumentInternal(TextDocument.create(this.file.documentUser.uri, this.file.documentUser.languageId, v, newContent));
                    }
                }

                this.refreshFileParsed();

                let htmlPath = join(this.file.folderPath, "compiled.html");
                let tsPath = join(this.file.folderPath, "compiled.ts");
                if (this.writeHtml) {
                    writeFileSync(htmlPath, this.HTMLFile?.fileParsed?.compiledTxt ?? "");
                }
                else if (existsSync(htmlPath)) {
                    unlinkSync(htmlPath);
                }
                if (this.writeTs) {
                    writeFileSync(tsPath, newContent);
                }
                else if (existsSync(tsPath)) {
                    unlinkSync(tsPath);
                }
            }
        }
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
                let diagStart = this.file.documentInternal.offsetAt(diagnostic.range.start);
                let diagEnd = this.file.documentInternal.offsetAt(diagnostic.range.end);
                let found = false;
                let avoid = diagStart >= this.file.contentUser.length;
                for (let i = 0; i < this.viewMethodsInfo.length; i++) {
                    let start = this.viewMethodsInfo[i].fullStart;
                    let end = this.viewMethodsInfo[i].end;

                    if (diagStart > start && diagEnd < end) {
                        // it's inside the {{ }}
                        diagnostic.source = AventusLanguageId.HTML;
                        let methodView = this.viewMethodsInfo[i].fct;
                        let offsetAfter = this.viewMethodsInfo[i].offsetAfter
                        let offsetBefore = this.viewMethodsInfo[i].offsetBefore

                        if (convertedRanges.indexOf(diagnostic.range) == -1) {
                            let offsetReturn = this.viewMethodsInfo[i].transform(diagStart, 0);

                            convertedRanges.push(diagnostic.range);
                            let offsetStart = diagStart - this.viewMethodsInfo[i].start - offsetReturn;
                            let offsetEnd = diagEnd - this.viewMethodsInfo[i].start - offsetReturn;

                            for (let j = 0; j < methodView.positions.length; j++) {
                                let start = methodView.positions[j].start;
                                let end = methodView.positions[j].end;
                                let diag: Diagnostic = diagnostic;

                                if (j > 0) {
                                    diag = { ...diagnostic };
                                }
                                let finalPositionStart = start + offsetBefore + offsetStart;
                                let finalPositionEnd = start + offsetBefore + offsetEnd;
                                if (finalPositionStart < start || finalPositionEnd > end - offsetAfter) {
                                    diag.range = {
                                        start: html.file.documentInternal.positionAt(start),
                                        end: html.file.documentInternal.positionAt(end)
                                    }
                                }
                                else {
                                    diag.range = {
                                        start: html.file.documentInternal.positionAt(finalPositionStart),
                                        end: html.file.documentInternal.positionAt(finalPositionEnd)
                                    }
                                }
                                if (j > 0) {
                                    htmlDiags.push(diag);
                                }
                            }

                        }
                        found = true;

                        break;
                    }
                }

                if (found) {
                    htmlDiags.push(diagnostic);
                }
                else if (!avoid) {
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

    private quickParse() {
        let quickParse = QuickParser.parse(this.file.documentUser.getText(), this.build);
        this._componentEnd = quickParse.end;
        this._fullname = quickParse.fullname;
        this._componentClassName = quickParse.className;
        this.writeHtml = quickParse.writeHtml;
        this.writeTs = quickParse.writeTs;
        let space = "";
        for (let i = 0; i < quickParse.whiteSpaceBefore + 4; i++) {
            space += " ";
        }
        this._space = space;
    }
    protected async onContentChange(): Promise<void> {
        this.quickParse();
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
                            srcToUpdate = result.hotReload;
                            compName = result.classScript;
                            classInfo = this.fileParsed?.classes[compName]
                        }
                    }
                }
            }
        }
        if (!this.build.reloadPage && reloadComp && classInfo) {
            //srcToUpdate = srcToUpdate.replace(/if\(\!window\.customElements\.get\(.*$/gm, '');

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
        let offsetFrom = html.file.documentInternal.offsetAt(htmlPosition);
        for (let viewMethodInfo of this.viewMethodsInfo) {
            for (let position of viewMethodInfo.fct.positions) {
                if (offsetFrom >= position.start + viewMethodInfo.offsetBefore && offsetFrom <= position.end) {
                    let offset = offsetFrom - position.start - viewMethodInfo.offsetAfter;
                    let offsetOnFile = viewMethodInfo.start + offset;
                    offsetOnFile = viewMethodInfo.transform(offsetOnFile, offsetOnFile)
                    let positionOnFile = this.file.documentInternal.positionAt(offsetOnFile);
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
                                    let textEditStart = this.file.documentInternal.offsetAt(textEdit.range.start);
                                    let textEditEnd = this.file.documentInternal.offsetAt(textEdit.range.end);

                                    let offsetReturn = viewMethodInfo.transform(textEditStart, 0);
                                    let offsetStart = textEditStart - viewMethodInfo.start - offsetReturn;
                                    let offsetEnd = textEditEnd - viewMethodInfo.start - offsetReturn;

                                    textEdit.range.start = html.file.documentInternal.positionAt(position.start + viewMethodInfo.offsetBefore + offsetStart);
                                    textEdit.range.end = html.file.documentInternal.positionAt(position.start + viewMethodInfo.offsetBefore + offsetEnd);

                                }
                            }
                        }
                        result.push(item);
                    }
                    resultTemp.items = result;
                    return resultTemp
                }
            }
        }
        return null;
    }
    protected async onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
        await this.runWebCompiler();
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
        let offsetFrom = html.file.documentInternal.offsetAt(htmlPosition);
        for (let viewMethodInfo of this.viewMethodsInfo) {
            for (let position of viewMethodInfo.fct.positions) {
                if (offsetFrom >= position.start + viewMethodInfo.offsetBefore && offsetFrom <= position.end) {
                    let offset = offsetFrom - position.start - viewMethodInfo.offsetAfter;
                    let offsetOnFile = viewMethodInfo.start + offset;
                    offsetOnFile = viewMethodInfo.transform(offsetOnFile, offsetOnFile);
                    let positionOnFile = this.file.documentInternal.positionAt(offsetOnFile);
                    let resultTemp = await this.onHover(this.file, positionOnFile);
                    if (resultTemp && resultTemp.range) {

                        let textEditStart = this.file.documentInternal.offsetAt(resultTemp.range.start);
                        let textEditEnd = this.file.documentInternal.offsetAt(resultTemp.range.end);

                        let offsetReturn = viewMethodInfo.transform(textEditStart, 0);
                        let offsetStart = textEditStart - viewMethodInfo.start - offsetReturn;
                        let offsetEnd = textEditEnd - viewMethodInfo.start - offsetReturn;

                        resultTemp.range.start = html.file.documentInternal.positionAt(position.start + viewMethodInfo.offsetBefore + offsetStart);
                        resultTemp.range.end = html.file.documentInternal.positionAt(position.start + viewMethodInfo.offsetBefore + offsetEnd);

                    }
                    return resultTemp;
                }
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
        let offsetFrom = html.file.documentInternal.offsetAt(htmlPosition);
        for (let viewMethodInfo of this.viewMethodsInfo) {
            for (let position of viewMethodInfo.fct.positions) {
                if (offsetFrom >= position.start + viewMethodInfo.offsetBefore && offsetFrom <= position.end) {
                    let offset = offsetFrom - position.start - viewMethodInfo.offsetAfter;
                    let offsetOnFile = viewMethodInfo.start + offset;
                    offsetOnFile = viewMethodInfo.transform(offset, offsetOnFile)
                    let positionOnFile = this.file.documentInternal.positionAt(offsetOnFile);
                    let resultTemp = await this.onDefinition(this.file, positionOnFile);
                    return resultTemp;
                }
            }
        }
        return null;
    }
    protected onDefinition(document: AventusFile, position: Position): Promise<Definition | null> {
        return this.tsLanguageService.findDefinition(document, position);
    }

    public async doFormatting(range: Range, options: FormattingOptions): Promise<HTMLFormat[] | null> {
        const html = this.HTMLFile;
        if (!html) {
            return null;
        }
        return (await this.getFormatting(options, false)).html;
    }
    protected async onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
        return (await this.getFormatting(options, true)).js;
    }

    private async getFormatting(options: FormattingOptions, semiColon: boolean): Promise<{ js: TextEdit[], html: HTMLFormat[] }> {
        let result: {
            js: TextEdit[],
            html: HTMLFormat[]
        } = { js: [], html: [] }
        let range: Range = {
            start: { character: 0, line: 0 },
            end: this.file.documentInternal.positionAt(this.file.contentInternal.length)
        };
        let formats = await this.tsLanguageService.format(this.file, range, options, semiColon);
        let html = this.HTMLFile;
        let convertedRanges: Range[] = [];
        for (let format of formats) {
            let diagStart = this.file.documentInternal.offsetAt(format.range.start);
            let diagEnd = this.file.documentInternal.offsetAt(format.range.end);
            let found = false;
            let avoid = diagStart >= this.file.contentUser.length;
            if (html) {
                for (let i = 0; i < this.viewMethodsInfo.length; i++) {
                    let start = this.viewMethodsInfo[i].start;
                    let end = this.viewMethodsInfo[i].end;
                    let offsetReturn = this.viewMethodsInfo[i].transform(diagStart, 0);
                    if (diagStart >= start + offsetReturn && diagEnd < end) {
                        if (diagStart == start && !/\S/.test(format.newText)) {
                            found = true;
                            break;
                        }
                        // it's inside the {{ }}
                        let methodView = this.viewMethodsInfo[i].fct;
                        let offsetBefore = this.viewMethodsInfo[i].offsetBefore

                        if (convertedRanges.indexOf(format.range) == -1) {

                            convertedRanges.push(format.range);
                            let offsetStart = diagStart - this.viewMethodsInfo[i].start - offsetReturn;
                            let offsetEnd = diagEnd - this.viewMethodsInfo[i].start - offsetReturn;
                            for (let j = 0; j < methodView.positions.length; j++) {
                                let finalPositionStart = methodView.positions[j].start + offsetBefore + offsetStart;
                                let finalPositionEnd = methodView.positions[j].start + offsetBefore + offsetEnd;
                                result.html.push({
                                    edit: {
                                        newText: format.newText,
                                        range: {
                                            start: finalPositionStart,
                                            end: finalPositionEnd
                                        }
                                    },
                                    start: methodView.positions[j].start,
                                    end: methodView.positions[j].end,
                                    kind: this.viewMethodsInfo[i].kind
                                });
                            }


                        }
                        found = true;
                        break;
                    }
                    else if (diagStart >= this.viewMethodsInfo[i].fullStart && diagEnd <= end) {
                        found = true;
                        break;
                    }
                }
            }

            if (!found && !avoid) {
                result.js.push(format);
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
        let offsetFrom = html.file.documentInternal.offsetAt(htmlPosition);
        for (let viewMethodInfo of this.viewMethodsInfo) {
            for (let position of viewMethodInfo.fct.positions) {
                if (offsetFrom >= position.start + viewMethodInfo.offsetBefore && offsetFrom <= position.end) {
                    let offset = offsetFrom - position.start - viewMethodInfo.offsetAfter;
                    let offsetOnFile = viewMethodInfo.start + offset;
                    offsetOnFile = viewMethodInfo.transform(offsetOnFile, offsetOnFile);
                    let positionOnFile = this.file.documentInternal.positionAt(offsetOnFile);
                    let resultTemps = await this.onReferences(this.file, positionOnFile);
                    return resultTemps;
                }
            }
        }
        return null;
    }
    protected async onReferences(document: AventusFile, position: Position): Promise<Location[]> {
        let locationsHTML: Location[] = []
        let locationsTs = await this.tsLanguageService.onReferences(document, position) || [];
        if (this._compilationResult?.componentName && this.fileParsed?.classes[this._compilationResult.componentName]) {
            let offset = this.file.documentInternal.offsetAt(position);
            let classParsed = this.fileParsed?.classes[this._compilationResult.componentName];
            if (offset >= classParsed.nameStart && offset <= classParsed.nameEnd) {
                for (let [file, positions] of this.reverseViewClassInfoDependances) {
                    for (let position of positions) {
                        locationsHTML.push({
                            uri: file.file.uri,
                            range: {
                                start: file.file.documentInternal.positionAt(position.start),
                                end: file.file.documentInternal.positionAt(position.end),
                            }
                        })
                    }
                }
            }
        }
        let locations = [...locationsTs, ...locationsHTML];
        locations = this.transformRefrencesToView(locations);
        return locations;
    }

    protected transformRefrencesToView(locations: Location[]) {
        let result: Location[] = [];
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
                        let diagStart = file._file.documentInternal.offsetAt(location.range.start);
                        let diagEnd = file._file.documentInternal.offsetAt(location.range.end);
                        for (let i = 0; i < this.viewMethodsInfo.length; i++) {
                            let start = this.viewMethodsInfo[i].fullStart;
                            let end = this.viewMethodsInfo[i].end;

                            if (diagStart > start && diagEnd < end) {
                                // it's inside the {{ }}
                                location.uri = html.file.uri;
                                let methodView = this.viewMethodsInfo[i].fct;
                                let offsetBefore = this.viewMethodsInfo[i].offsetBefore;
                                let offsetAfter = this.viewMethodsInfo[i].offsetAfter;

                                if (convertedRanges.indexOf(location.range) == -1) {
                                    let offsetReturn = this.viewMethodsInfo[i].transform(diagStart, 0);
                                    convertedRanges.push(location.range);
                                    let offsetStart = diagStart - this.viewMethodsInfo[i].start - offsetReturn;
                                    let offsetEnd = diagEnd - this.viewMethodsInfo[i].start - offsetReturn;

                                    for (let j = 0; j < methodView.positions.length; j++) {
                                        let finalPositionStart = methodView.positions[j].start + offsetBefore + offsetStart;
                                        let finalPositionEnd = methodView.positions[j].start + offsetBefore + offsetEnd;
                                        let loc: Location = location;
                                        if (j > 0) {
                                            loc = { ...loc };
                                        }
                                        loc.range = {
                                            start: html.file.documentInternal.positionAt(finalPositionStart),
                                            end: html.file.documentInternal.positionAt(finalPositionEnd)
                                        }
                                        if (j > 0) {
                                            result.push(loc);
                                        }
                                    }

                                }
                                break;
                            }
                        }
                    }

                }
            }
            result.push(location);
        }
        return result;
    }


    protected async onCodeLens(document: AventusFile): Promise<CodeLens[]> {
        return this.tsLanguageService.onCodeLens(document);
    }

    public async doRename(htmlPosition: Position, newName: string): Promise<WorkspaceEdit | null> {
        const html = this.HTMLFile;
        if (!html) {
            return null;
        }
        let offsetFrom = html.file.documentInternal.offsetAt(htmlPosition);
        for (let viewMethodInfo of this.viewMethodsInfo) {
            for (let position of viewMethodInfo.fct.positions) {
                if (offsetFrom >= position.start + viewMethodInfo.offsetBefore && offsetFrom <= position.end) {
                    let offset = offsetFrom - position.start - viewMethodInfo.offsetAfter;
                    let offsetOnFile = viewMethodInfo.start + offset;
                    offsetOnFile = viewMethodInfo.transform(offsetOnFile, offsetOnFile);
                    let positionOnFile = this.file.documentInternal.positionAt(offsetOnFile);
                    let resultTemps = await this.onRename(this.file, positionOnFile, newName);
                    return resultTemps;
                }
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
                                let diagStart = file._file.documentInternal.offsetAt(change.range.start);
                                let diagEnd = file._file.documentInternal.offsetAt(change.range.end);
                                for (let i = 0; i < this.viewMethodsInfo.length; i++) {
                                    let start = this.viewMethodsInfo[i].fullStart;
                                    let end = this.viewMethodsInfo[i].end;

                                    if (diagStart > start && diagEnd < end) {
                                        // it's inside the {{ }}
                                        if (!toAdd[html.file.uri]) {
                                            toAdd[html.file.uri] = [];
                                        }
                                        let methodView = this.viewMethodsInfo[i].fct;

                                        let offsetReturn = this.viewMethodsInfo[i].transform(diagStart, 0);

                                        let offsetStart = diagStart - this.viewMethodsInfo[i].start - offsetReturn;
                                        let offsetEnd = diagEnd - this.viewMethodsInfo[i].start - offsetReturn;

                                        for (let position of methodView.positions) {
                                            let finalPositionStart = position.start + this.viewMethodsInfo[i].offsetBefore + offsetStart;
                                            let finalPositionEnd = position.start + this.viewMethodsInfo[i].offsetBefore + offsetEnd;

                                            toAdd[html.file.uri].push({
                                                newText: change.newText,
                                                range: {
                                                    start: html.file.documentInternal.positionAt(finalPositionStart),
                                                    end: html.file.documentInternal.positionAt(finalPositionEnd)
                                                }
                                            });
                                        }

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
                                        start: this.file.documentInternal.positionAt(data.start),
                                        end: this.file.documentInternal.positionAt(data.end),
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

