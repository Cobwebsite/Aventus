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

export class AventusWebComponentLogicalFile extends AventusTsFile {
    private _compilationResult: CompileComponentResult | undefined;
    public canUpdateComponent: boolean = true;
    public get compilationResult() {
        return this._compilationResult;
    }
    protected get extension(): string {
        return AventusExtension.ComponentLogic;
    }

    public getHTMLFile(): AventusHTMLFile | undefined {
        if (this.file.uri.endsWith(AventusExtension.Component)) {
            return this.build.wcFiles[this.file.uri].view;
        }
        return this.build.htmlFiles[this.file.uri.replace(AventusExtension.ComponentLogic, AventusExtension.ComponentView)];
    }

    constructor(file: AventusFile, build: Build) {
        super(file, build);
        this.refreshFileParsed();
    }




    private waitingFct: { [version: string]: (() => void)[] } = {};
    private version = '-1_-1_-1';
    private isCompiling = false;
    private runWebCompiler() {
        return new Promise<void>((resolve) => {
            let version = AventusWebcomponentCompiler.getVersion(this, this.build);
            let mergedVersion = version.ts + '_' + version.scss + '_' + version.html;
            if (mergedVersion == this.version) {
                resolve();
            }
            else {
                if (!this.isCompiling) {
                    this.isCompiling = true;
                    this._compilationResult = new AventusWebcomponentCompiler(this, this.build).compile();
                    this.build.scssLanguageService.addInternalDefinition(this.file.uri, this._compilationResult.scssDoc);
                    this.build.htmlLanguageService.addInternalDefinition(this.file.uri, this._compilationResult.htmlDoc, this);
                    this.isCompiling = false;
                    this.version = mergedVersion;
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



    protected async onValidate(): Promise<Diagnostic[]> {
        await this.runWebCompiler();
        this.diagnostics = this.compilationResult?.diagnostics || []
        this.getHTMLFile()?.validate();
        if (this.fileParsed) {
            this.diagnostics = this.diagnostics.concat(this.fileParsed.errors)
        }
        return this.diagnostics;
    }
    protected async onContentChange(): Promise<void> {
        this.refreshFileParsed();
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
            writeFileSync(this.file.folderPath + '/compiled.js', this.compilationResult.debug);
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
            srcToUpdate = srcToUpdate.replace(/window\.customElements\.define\(.*$/gm, '');
            // TODO check side effects => maybe use real position instead of regex
            for (let dependance of classInfo.dependances) {
                if (dependance.uri == "@local") {
                    let fullName = dependance.fullName.replace("$namespace$", this.buildNamespace);
                    let regexp = new RegExp("(" + dependance.fullName.replace("$namespace$", "") + ")(\\(|\\.|,|;| )", 'g');
                    srcToUpdate = srcToUpdate.replace(regexp, fullName + "$2");
                }
                else if (dependance.uri != "@external") {
                    let namespace = this.build.getNamespace(dependance.uri);
                    let fullName = dependance.fullName.replace("$namespace$", namespace);
                    let regexp = new RegExp("(" + dependance.fullName.replace("$namespace$", "") + ")(\\(|\\.|,|;| )", 'g');
                    srcToUpdate = srcToUpdate.replace(regexp, fullName + "$2");
                }
            }
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
    protected onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
        return this.tsLanguageService.doComplete(document, position);
    }
    protected onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem> {
        return this.tsLanguageService.doResolve(item);
    }
    protected onHover(document: AventusFile, position: Position): Promise<Hover | null> {
        return this.tsLanguageService.doHover(document, position);
    }
    protected onDefinition(document: AventusFile, position: Position): Promise<Definition | null> {
        return this.tsLanguageService.findDefinition(document, position);
    }
    protected onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
        return this.tsLanguageService.format(document, range, options);
    }
    protected async onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
        let actions = await this.tsLanguageService.doCodeAction(document, range);
        this.addCustomCodeAction(actions);
        return actions;
    }
    protected async onReferences(document: AventusFile, position: Position): Promise<Location[]> {
        let locationsHTML: Location[] = []
        let locationsTs = await this.tsLanguageService.onReferences(document, position) || [];
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
        return [...locationsTs, ...locationsHTML];
    }
    protected async onCodeLens(document: AventusFile): Promise<CodeLens[]> {
        return this.tsLanguageService.onCodeLens(document);
    }
    protected async onRename(document: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null> {
        return this.tsLanguageService.onRename(document, position, newName);
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
                result += "@ViewElement()" + EOL + "protected " + name + ": " + this.compilationResult.missingViewElements.elements[name] + ";" + EOL
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
        let htmlFile = this.getHTMLFile();
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
        let htmlFile = this.getHTMLFile();
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

interface AventusWebComponentSingleFileRegion<T extends AventusBaseFile> {
    start: number,
    end: number,
    file?: T,
}
export class AventusWebComponentSingleFile extends AventusTsFile {
    private regionLogic: AventusWebComponentSingleFileRegion<AventusWebComponentLogicalFile> = {
        start: 0,
        end: 0,
    }
    private regionStyle: AventusWebComponentSingleFileRegion<AventusWebSCSSFile> = {
        start: 0,
        end: 0
    }
    private regionView: AventusWebComponentSingleFileRegion<AventusHTMLFile> = {
        start: 0,
        end: 0
    }

    public get logic(): AventusWebComponentLogicalFile {
        if (this.regionLogic.file) {
            return this.regionLogic.file
        }
        let fileTemp = this.getDocuments().ts;
        this.regionLogic.file = fileTemp;
        return fileTemp;
    }
    public get style(): AventusWebSCSSFile {
        if (this.regionStyle.file) {
            return this.regionStyle.file
        }
        let fileTemp = this.getDocuments().scss;
        this.regionStyle.file = fileTemp;
        return fileTemp;
    }
    public get view(): AventusHTMLFile {
        if (this.regionView.file) {
            return this.regionView.file
        }
        let fileTemp = this.getDocuments().html;
        this.regionView.file = fileTemp;
        return fileTemp;
    }

    protected get extension(): string {
        return AventusExtension.Component;
    }

    protected mustBeAddedToLanguageService(): boolean {
        return false;
    }

    public constructor(file: AventusFile, build: Build) {
        super(file, build);
        let result = this.getDocuments();
        this.regionLogic.file = result.ts;
        this.build.tsFiles[result.ts.file.uri] = result.ts;
        this.regionStyle.file = result.scss;
        this.regionView.file = result.html;
    }
    protected async onValidate(): Promise<Diagnostic[]> {
        let diagnostics: Diagnostic[] = [];
        let convertedRanges: Range[] = [];

        const _convertSection = async (region: AventusWebComponentSingleFileRegion<AventusBaseFile>) => {
            if (region.file) {
                let errors = await (region.file.file as InternalAventusFile).validate();
                let document = region.file.file.document;
                for (let error of errors) {
                    error.source = AventusLanguageId.WebComponent;
                    if (convertedRanges.indexOf(error.range) == -1) {
                        convertedRanges.push(error.range);
                        error.range.start = this.file.document.positionAt(document.offsetAt(error.range.start) + region.start);
                        error.range.end = this.file.document.positionAt(document.offsetAt(error.range.end) + region.start);
                    }
                    diagnostics.push(error);
                }
            }
        }
        await _convertSection(this.regionStyle);
        await _convertSection(this.regionView);
        await _convertSection(this.regionLogic);



        return diagnostics;
    }
    protected async onContentChange(): Promise<void> {
        let result = this.splitDocument();
        const _convertSection = async (region: AventusWebComponentSingleFileRegion<AventusBaseFile>, languageId: string, newText: string) => {
            let newDocument = TextDocument.create(this.file.uri, languageId, this.file.version, newText);
            if (region.file) {
                region.file.file.document = newDocument;
                region.file.triggerContentChange();
            }
        }
        await _convertSection(this.regionStyle, AventusLanguageId.SCSS, result.cssText);
        await _convertSection(this.regionView, AventusLanguageId.HTML, result.htmlText);
        await _convertSection(this.regionLogic, AventusLanguageId.TypeScript, result.scriptText);
    }
    protected async onSave() {
        this.build.disableBuild();
        (this.style.file as InternalAventusFile).triggerSave(this.style.file.document);
        (this.view.file as InternalAventusFile).triggerSave(this.view.file.document);
        this.build.enableBuild();
        (this.logic.file as InternalAventusFile).triggerSave(this.logic.file.document);
    }
    protected async onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
        let currentOffset = document.document.offsetAt(position);
        let convertedRanges: Range[] = [];

        const generateComplete = async (region: AventusWebComponentSingleFileRegion<AventusBaseFile>): Promise<CompletionList | undefined> => {
            if (currentOffset >= region.start && currentOffset <= region.end && region.file) {
                let result = await (region.file?.file as InternalAventusFile).getCompletion(region.file.file.document.positionAt(currentOffset - region.start));

                for (let item of result.items) {
                    if (item.data && item.data.uri) {
                        item.data.previousLanguageId = item.data.languageId;
                        item.data.languageId = AventusLanguageId.WebComponent;
                    }
                    if (item.textEdit) {
                        let textEdit = item.textEdit as TextEdit;
                        if (textEdit.range) {
                            if (convertedRanges.indexOf(textEdit.range) == -1) {
                                convertedRanges.push(textEdit.range)
                                textEdit.range.start = this.transformPosition(region.file, textEdit.range.start, this, region.start * -1);
                                textEdit.range.end = this.transformPosition(region.file, textEdit.range.end, this, region.start * -1);
                            }
                        }
                    }
                }
                return result
            }
            return undefined;
        }

        let cssResult = await generateComplete(this.regionStyle);
        if (cssResult) { return cssResult; }
        let htmlResult = await generateComplete(this.regionView);
        if (htmlResult) { return htmlResult; }
        let jsResult = await generateComplete(this.regionLogic);
        if (jsResult) { return jsResult; }

        return { isIncomplete: false, items: [] };
    }

    protected async onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem> {
        let convertedRanges: Range[] = [];

        if (item.data) {
            if (item.data.previousLanguageId) {
                let previousLanguageId = item.data.previousLanguageId;
                delete item.data.previousLanguageId;

                const generateCompletionResolve = async (region: AventusWebComponentSingleFileRegion<AventusBaseFile>, languageId: string): Promise<CompletionItem | undefined> => {
                    if (previousLanguageId == languageId) {
                        let subfile = region.file;
                        if (subfile) {
                            let resultTemp = await (subfile.file as InternalAventusFile).getCompletionResolve(item);
                            if (resultTemp.additionalTextEdits) {
                                for (let edit of resultTemp.additionalTextEdits) {
                                    if (subfile.file.document.offsetAt(edit.range.start) == 0) {
                                        edit.newText = EOL + edit.newText;
                                    }
                                    if (convertedRanges.indexOf(edit.range) == -1 && !edit.range["wc_transformed"]) {
                                        convertedRanges.push(edit.range);
                                        edit.range["wc_transformed"] = true;
                                        edit.range.start = this.transformPosition(subfile, edit.range.start, this, region.start * -1);
                                        edit.range.end = this.transformPosition(subfile, edit.range.end, this, region.start * -1);
                                    }

                                }
                            }
                            return resultTemp;
                        }
                    }
                    return undefined;
                }

                let cssResult = await generateCompletionResolve(this.regionStyle, AventusLanguageId.SCSS);
                if (cssResult) { return cssResult; }
                let htmlResult = await generateCompletionResolve(this.regionView, AventusLanguageId.HTML);
                if (htmlResult) { return htmlResult; }
                let jsResult = await generateCompletionResolve(this.regionLogic, AventusLanguageId.TypeScript);
                if (jsResult) { return jsResult; }
            }
        }
        return item;
    }
    protected async onHover(document: AventusFile, position: Position): Promise<Hover | null> {
        let currentOffset = document.document.offsetAt(position);
        let convertedRanges: Range[] = [];

        const generateHover = async (region: AventusWebComponentSingleFileRegion<AventusBaseFile>): Promise<Hover | null> => {
            if (currentOffset >= region.start && currentOffset <= region.end && region.file) {
                let result = await (region.file.file as InternalAventusFile).getHover(region.file.file.document.positionAt(currentOffset - region.start));
                if (result?.range) {
                    if (convertedRanges.indexOf(result.range) == -1) {
                        convertedRanges.push(result.range);
                        result.range.start = this.transformPosition(region.file, result.range.start, this, region.start * -1);
                        result.range.end = this.transformPosition(region.file, result.range.end, this, region.start * -1);
                    }
                }
                return result;
            }
            return null;
        }

        let cssResult = await generateHover(this.regionStyle);
        if (cssResult) { return cssResult; }
        let htmlResult = await generateHover(this.regionView);
        if (htmlResult) { return htmlResult; }
        let jsResult = await generateHover(this.regionLogic);
        if (jsResult) { return jsResult; }

        return null;
    }
    protected async onDefinition(document: AventusFile, position: Position): Promise<Definition | null> {
        let currentOffset = document.document.offsetAt(position);
        let result: Definition | null = null;
        if (currentOffset >= this.regionStyle.start && currentOffset <= this.regionStyle.end) {
            result = await (this.style.file as InternalAventusFile).getDefinition(this.style.file.document.positionAt(currentOffset - this.regionStyle.start));
        }
        else if (currentOffset >= this.regionView.start && currentOffset <= this.regionView.end) {
            result = await (this.view.file as InternalAventusFile).getDefinition(this.view.file.document.positionAt(currentOffset - this.regionView.start));
        }
        else if (currentOffset >= this.regionLogic.start && currentOffset <= this.regionLogic.end) {
            result = await (this.logic.file as InternalAventusFile).getDefinition(this.logic.file.document.positionAt(currentOffset - this.regionLogic.start));
        }

        return result;
    }
    protected async onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
        let result: TextEdit[] = [];
        let convertedRanges: Range[] = [];

        const generateFormatting = async (region: AventusWebComponentSingleFileRegion<AventusBaseFile>): Promise<void> => {
            if (region.file) {
                let resultsTemp = await (region.file.file as InternalAventusFile).getFormatting(options)
                for (let temp of resultsTemp) {
                    temp.newText = temp.newText.split('\n').join("\n\t");
                    if (temp.range.start.character == 0 && temp.range.start.line == 0) {
                        temp.newText = EOL + "\t" + temp.newText;
                    }
                    if (temp.range.start.character == 0) {
                        temp.newText = "\t" + temp.newText;
                    }
                    if (region.file.file.document.offsetAt(temp.range.end) == region.file.file.document.getText().length) {
                        temp.newText = temp.newText + EOL;
                    }
                    if (convertedRanges.indexOf(temp.range) == -1) {
                        convertedRanges.push(temp.range);
                        temp.range.start = this.transformPosition(region.file, temp.range.start, this, region.start * -1);
                        temp.range.end = this.transformPosition(region.file, temp.range.end, this, region.start * -1);
                    }
                    result.push(temp);
                }
            }
        }
        await generateFormatting(this.regionStyle);
        await generateFormatting(this.regionView);
        await generateFormatting(this.regionLogic);

        return result;
    }
    protected async onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
        let rangeSelected = {
            start: document.document.offsetAt(range.start),
            end: document.document.offsetAt(range.end)
        }
        let convertedRanges: Range[] = [];

        const generateCodeAction = async (region: AventusWebComponentSingleFileRegion<AventusBaseFile>): Promise<CodeAction[] | undefined> => {
            if (this.isOverlapping(rangeSelected, region) && region.file) {
                let results = await (region.file.file as InternalAventusFile).getCodeAction({
                    start: this.transformPosition(this, range.start, region.file, region.start),
                    end: this.transformPosition(this, range.end, region.file, region.start)
                })

                for (let result of results) {
                    if (result.edit) {
                        if (result.edit.changes) {
                            let changesFinal: TextEdit[] = [];
                            for (let changeFile in result.edit.changes) {
                                let changes = result.edit.changes[changeFile];
                                for (let change of changes) {
                                    if (convertedRanges.indexOf(change.range) == -1) {
                                        convertedRanges.push(change.range);
                                        change.range.start = this.transformPosition(region.file, change.range.start, this, region.start * -1);
                                        change.range.end = this.transformPosition(region.file, change.range.end, this, region.start * -1);
                                    }
                                    changesFinal.push(change);
                                }
                            }
                            if (changesFinal.length > 0) {
                                delete result.edit.changes[region.file.file.uri];
                                result.edit.changes[document.uri] = changesFinal;
                            }
                        }
                    }
                }
                return results;
            }
            return undefined;
        }

        let resultTemp: CodeAction[] | undefined;
        resultTemp = await generateCodeAction(this.regionStyle);
        if (resultTemp) { return resultTemp };

        resultTemp = await generateCodeAction(this.regionView);
        if (resultTemp) { return resultTemp };

        resultTemp = await generateCodeAction(this.regionLogic);
        if (resultTemp) { return resultTemp };


        return [];
    }

    protected async onDelete(): Promise<void> {
        await super.onDelete();
        delete this.build.tsFiles[this.file.uri];
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


    private getDocuments() {
        let resultTxt = this.splitDocument();

        let htmlFileTemp = new InternalAventusFile(TextDocument.create(this.file.uri, AventusLanguageId.HTML, this.file.version, resultTxt.htmlText));
        let scssFileTemp = new InternalAventusFile(TextDocument.create(this.file.uri, AventusLanguageId.SCSS, this.file.version, resultTxt.cssText));
        let tsFileTemp = new InternalAventusFile(TextDocument.create(this.file.uri, AventusLanguageId.HTML, this.file.version, resultTxt.scriptText));

        return {
            html: new AventusHTMLFile(htmlFileTemp, this.build),
            scss: new AventusWebSCSSFile(scssFileTemp, this.build),
            ts: new AventusWebComponentLogicalFile(tsFileTemp, this.build)
        };
    }

    private splitDocument() {
        let regexScript = /<script>((\s|\S)*)<\/script>/g;
        let regexTemplate = /<template>((\s|\S)*)<\/template>/g;
        let regexStyle = /<style>((\s|\S)*)<\/style>/g;

        let resultTxt = {
            cssText: '',
            htmlText: '',
            scriptText: ''
        }

        let scriptMatch = regexScript.exec(this.file.content);
        if (scriptMatch) {
            let startIndex = scriptMatch.index + 8;
            this.regionLogic.start = startIndex;
            let endIndex = scriptMatch.index + scriptMatch[0].length - 9;
            this.regionLogic.end = endIndex;
            resultTxt.scriptText = this.file.content.substring(startIndex, endIndex)
        }

        let styleMatch = regexStyle.exec(this.file.content);
        if (styleMatch) {
            let startIndex = styleMatch.index + 7;
            this.regionStyle.start = startIndex;
            let endIndex = styleMatch.index + styleMatch[0].length - 8;
            this.regionStyle.end = endIndex;
            resultTxt.cssText = this.file.content.substring(startIndex, endIndex)
        }

        let htmlMatch = regexTemplate.exec(this.file.content);
        if (htmlMatch) {
            let startIndex = htmlMatch.index + 10;
            this.regionView.start = startIndex;
            let endIndex = htmlMatch.index + htmlMatch[0].length - 11;
            this.regionView.end = endIndex;
            resultTxt.htmlText = this.file.content.substring(startIndex, endIndex)
        }

        return resultTxt;
    }
    private transformPosition(fileFrom: AventusBaseFile, positionFrom: Position, fileTo: AventusBaseFile, offset: number): Position {
        let currentOffset = fileFrom.file.document.offsetAt(positionFrom);
        return fileTo.file.document.positionAt(currentOffset - offset);
    }
    private isOverlapping(rangeSelected: { start: number, end: number }, rangeSection: { start: number, end: number }): boolean {
        return (rangeSection.start < rangeSelected.start && rangeSection.end > rangeSelected.start) ||
            (rangeSection.start < rangeSelected.end && rangeSection.end > rangeSelected.end) ||
            (rangeSection.start > rangeSelected.start && rangeSection.end < rangeSelected.end)
    }



    public static getRegion(file: AventusFile) {
        let regexScript = /<script>((\s|\S)*)<\/script>/g;
        let regexTemplate = /<template>((\s|\S)*)<\/template>/g;
        let regexStyle = /<style>((\s|\S)*)<\/style>/g;

        let resultTxt = {
            cssText: '',
            htmlText: '',
            scriptText: ''
        }

        let scriptMatch = regexScript.exec(file.content);
        if (scriptMatch) {
            let startIndex = scriptMatch.index + 8;
            let endIndex = scriptMatch.index + scriptMatch[0].length - 9;
            resultTxt.scriptText = file.content.substring(startIndex, endIndex)
        }

        let styleMatch = regexStyle.exec(file.content);
        if (styleMatch) {
            let startIndex = styleMatch.index + 7;
            let endIndex = styleMatch.index + styleMatch[0].length - 8;
            resultTxt.cssText = file.content.substring(startIndex, endIndex)
        }

        let htmlMatch = regexTemplate.exec(file.content);
        if (htmlMatch) {
            let startIndex = htmlMatch.index + 10;
            let endIndex = htmlMatch.index + htmlMatch[0].length - 11;
            resultTxt.htmlText = file.content.substring(startIndex, endIndex)
        }

        return resultTxt;
    }

}