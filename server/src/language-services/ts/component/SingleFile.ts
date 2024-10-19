import { EOL } from 'os';
import { Position, CompletionList, CompletionItem, Hover, Definition, Range, FormattingOptions, TextEdit, CodeAction, Diagnostic, Location, CodeLens, WorkspaceEdit } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { AventusExtension, AventusLanguageId } from "../../../definition";
import { AventusFile, InternalAventusFile } from '../../../files/AventusFile';
import { Build } from "../../../project/Build";
import { AventusBaseFile } from "../../BaseFile";
import { AventusHTMLFile } from "../../html/File";
import { AventusWebSCSSFile } from "../../scss/File";
import { AventusWebComponentLogicalFile } from './File';

interface AventusWebComponentSingleFileRegion<T extends AventusBaseFile> {
    start: number,
    end: number,
    file?: T,
}
type SplittedTxt = {
    cssText: string | null,
    htmlText: string | null,
    scriptText: string | null
}
export class AventusWebComponentSingleFile extends AventusBaseFile {
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
        throw 'should not append'
    }
    public get style(): AventusWebSCSSFile | undefined {
        return this.regionStyle.file
    }
    public get view(): AventusHTMLFile | undefined {
        return this.regionView.file
    }

    protected get extension(): string {
        return AventusExtension.Component;
    }



    public constructor(file: AventusFile, build: Build) {
        super(file, build);

        let result = this.getDocuments();
        this.regionLogic.file = result.ts;

        this.regionStyle.file = result.scss;
        this.regionView.file = result.html;
    }
    public async init() {
        await this.regionView.file?.init();
        await this.regionStyle.file?.init();
        if (!this.regionView.file || !this.regionStyle.file) {
            await this.file.validate();
        }
    }
    protected async onValidate(): Promise<Diagnostic[]> {
        await this.transformDocument();
        let diagnostics: Diagnostic[] = [];
        let convertedRanges: Range[] = [];

        const _convertSection = async (region: AventusWebComponentSingleFileRegion<AventusBaseFile>) => {
            if (region.file) {
                let errors = await (region.file.file as InternalAventusFile).validate();
                let document = region.file.file.documentInternal;
                for (let error of errors) {
                    error.source = AventusLanguageId.WebComponent;
                    if (convertedRanges.indexOf(error.range) == -1) {
                        convertedRanges.push(error.range);
                        error.range.start = this.file.documentInternal.positionAt(document.offsetAt(error.range.start) + region.start);
                        error.range.end = this.file.documentInternal.positionAt(document.offsetAt(error.range.end) + region.start);
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

    private waitingFct: { [version: string]: (() => void)[] } = {};
    private currentVersion = '';
    private isCompiling = false;
    protected transformDocument() {
        return new Promise<void>(async (resolve) => {
            let version = this.file.versionInternal + '';
            let force = this.build.insideRebuildAll;
            if (version == this.currentVersion && !force) {
                resolve();
            }
            else {
                if (!this.isCompiling) {
                    this.isCompiling = true;
                    let result = this.splitDocument();
                    const _convertSection = async (region: AventusWebComponentSingleFileRegion<AventusBaseFile>, languageId: string, newText: string) => {
                        let newDocument = TextDocument.create(this.file.uri, languageId, this.file.versionUser, newText);
                        if (region.file) {
                            await region.file.triggerContentChange(newDocument);
                        }
                        else {
                            if (languageId == AventusLanguageId.HTML) {
                                let htmlFileTemp = new InternalAventusFile(TextDocument.create(this.file.uri, AventusLanguageId.HTML, this.file.versionUser, newText));
                                let htmlFile = new AventusHTMLFile(htmlFileTemp, this.build)
                                region.file = htmlFile;
                                await htmlFile.init();
                            }
                            else if (languageId == AventusLanguageId.SCSS) {
                                let scssFileTemp = new InternalAventusFile(TextDocument.create(this.file.uri, AventusLanguageId.SCSS, this.file.versionUser, newText));
                                let scssFile = new AventusWebSCSSFile(scssFileTemp, this.build);
                                region.file = scssFile;
                                await scssFile.init();
                            }
                        }
                    }
                    if (result.cssText !== null) {
                        await _convertSection(this.regionStyle, AventusLanguageId.SCSS, result.cssText);
                    }
                    else if (this.regionStyle.file) {
                        // delete file
                        this.regionStyle.file.triggerDelete();
                        this.regionStyle.file = undefined;
                    }

                    if (result.htmlText !== null) {
                        await _convertSection(this.regionView, AventusLanguageId.HTML, result.htmlText);
                    }
                    else if (this.regionView.file) {
                        // delete file
                        this.regionView.file.triggerDelete();
                        this.regionView.file = undefined;
                    }

                    if (result.scriptText !== null)
                        await _convertSection(this.regionLogic, AventusLanguageId.TypeScript, result.scriptText);

                    this.isCompiling = false;
                    this.currentVersion = version;
                    if (this.waitingFct[version]) {
                        for (let fct of this.waitingFct[version]) {
                            fct();
                        }
                    }
                    resolve();
                }
                else {
                    if (!this.waitingFct[version]) {
                        this.waitingFct[version] = [];
                    }
                    this.waitingFct[version].push(() => {
                        resolve();
                    })

                }
            }
        })
    }
    protected async onContentChange(): Promise<void> {
        await this.transformDocument();
    }
    protected async onSave() {
        this.build.disableBuild();
        if (this.style)
            await (this.style.file as InternalAventusFile).triggerSave();
        if (this.view)
            await (this.view.file as InternalAventusFile).triggerSave();
        this.build.enableBuild();
        await (this.logic.file as InternalAventusFile).triggerSave();
    }
    protected async onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
        await this.transformDocument();
        let currentOffset = document.documentInternal.offsetAt(position);
        let convertedRanges: Range[] = [];

        const generateComplete = async (region: AventusWebComponentSingleFileRegion<AventusBaseFile>): Promise<CompletionList | undefined> => {
            if (currentOffset >= region.start && currentOffset <= region.end && region.file) {
                let result = await (region.file?.file as InternalAventusFile).getCompletion(region.file.file.documentInternal.positionAt(currentOffset - region.start));

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
                                    if (subfile.file.documentInternal.offsetAt(edit.range.start) == 0) {
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
        let currentOffset = document.documentInternal.offsetAt(position);
        let convertedRanges: Range[] = [];

        const generateHover = async (region: AventusWebComponentSingleFileRegion<AventusBaseFile>): Promise<Hover | null> => {
            if (currentOffset >= region.start && currentOffset <= region.end && region.file) {
                let result = await (region.file.file as InternalAventusFile).getHover(region.file.file.documentInternal.positionAt(currentOffset - region.start));
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
        let currentOffset = document.documentInternal.offsetAt(position);
        let result: Definition | null = null;
        if (this.style && currentOffset >= this.regionStyle.start && currentOffset <= this.regionStyle.end) {
            result = await (this.style.file as InternalAventusFile).getDefinition(this.style.file.documentInternal.positionAt(currentOffset - this.regionStyle.start));
        }
        else if (this.view && currentOffset >= this.regionView.start && currentOffset <= this.regionView.end) {
            result = await (this.view.file as InternalAventusFile).getDefinition(this.view.file.documentInternal.positionAt(currentOffset - this.regionView.start));
        }
        else if (currentOffset >= this.regionLogic.start && currentOffset <= this.regionLogic.end) {
            result = await (this.logic.file as InternalAventusFile).getDefinition(this.logic.file.documentInternal.positionAt(currentOffset - this.regionLogic.start));
        }

        return result;
    }
    protected async onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
        let result: TextEdit[] = [];
        let convertedRanges: Range[] = [];
        const space = (x: number) => {
            let result = '';
            for (let i = 0; i < x * 4; i++) {
                result += ' ';
            }
            return result;
        }
        const generateFormatting = async (region: AventusWebComponentSingleFileRegion<AventusBaseFile>, correct: { firstLast: boolean, tab: boolean }): Promise<void> => {
            if (region.file) {
                let resultsTemp = await (region.file.file as InternalAventusFile).getFormatting(options)
                for (let temp of resultsTemp) {
                    if (correct.tab) {
                        temp.newText = temp.newText.split('\n').join("\n" + space(1));
                    }
                    if (correct.firstLast) {
                        temp.newText = temp.newText.trim();
                        if (temp.range.start.character == 0 && temp.range.start.line == 0) {
                            temp.newText = correct.tab ? EOL + space(1) + temp.newText : EOL + temp.newText;
                        }
                        if (region.file.file.documentInternal.offsetAt(temp.range.end) == region.file.file.documentInternal.getText().length) {
                            temp.newText = temp.newText + EOL;
                        }
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
        await generateFormatting(this.regionStyle, { firstLast: true, tab: true });
        await generateFormatting(this.regionView, { firstLast: true, tab: true });
        await generateFormatting(this.regionLogic, { firstLast: false, tab: false });

        return result;
    }
    protected async onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
        let rangeSelected = {
            start: document.documentInternal.offsetAt(range.start),
            end: document.documentInternal.offsetAt(range.end)
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

        let html: AventusHTMLFile | undefined = undefined;
        if (resultTxt.htmlText !== null) {
            let htmlFileTemp = new InternalAventusFile(TextDocument.create(this.file.uri, AventusLanguageId.HTML, this.file.versionUser, resultTxt.htmlText));
            let html = new AventusHTMLFile(htmlFileTemp, this.build);
        }

        let scss: AventusWebSCSSFile | undefined = undefined;
        if (resultTxt.cssText !== null) {
            let scssFileTemp = new InternalAventusFile(TextDocument.create(this.file.uri, AventusLanguageId.SCSS, this.file.versionUser, resultTxt.cssText));
            scss = new AventusWebSCSSFile(scssFileTemp, this.build);
        }


        let tsFileTemp = new InternalAventusFile(TextDocument.create(this.file.uri, AventusLanguageId.TypeScript, this.file.versionUser, resultTxt.scriptText ?? ''));
        let ts = new AventusWebComponentLogicalFile(tsFileTemp, this.build);

        const result = {
            html,
            scss,
            ts
        };

        this.build.tsFiles[result.ts.file.uri] = result.ts;


        return result;
    }

    private splitDocument(): SplittedTxt {
        let regexScript = /<script>((\s|\S)*)<\/script>/g;
        let regexTemplate = /<template>((\s|\S)*)<\/template>/g;
        let regexStyle = /<style>((\s|\S)*)<\/style>/g;

        let resultTxt: SplittedTxt = {
            cssText: null,
            htmlText: null,
            scriptText: null
        }

        let scriptMatch = regexScript.exec(this.file.contentInternal);
        if (scriptMatch) {
            let startIndex = scriptMatch.index + 8;
            this.regionLogic.start = startIndex;
            let endIndex = scriptMatch.index + scriptMatch[0].length - 9;
            this.regionLogic.end = endIndex;
            resultTxt.scriptText = this.file.contentInternal.substring(startIndex, endIndex)
        }

        let styleMatch = regexStyle.exec(this.file.contentInternal);
        if (styleMatch) {
            let startIndex = styleMatch.index + 7;
            this.regionStyle.start = startIndex;
            let endIndex = styleMatch.index + styleMatch[0].length - 8;
            this.regionStyle.end = endIndex;
            resultTxt.cssText = this.file.contentInternal.substring(startIndex, endIndex)
        }

        let htmlMatch = regexTemplate.exec(this.file.contentInternal);
        if (htmlMatch) {
            let startIndex = htmlMatch.index + 10;
            this.regionView.start = startIndex;
            let endIndex = htmlMatch.index + htmlMatch[0].length - 11;
            this.regionView.end = endIndex;
            resultTxt.htmlText = this.file.contentInternal.substring(startIndex, endIndex)
        }

        return resultTxt;
    }
    private transformPosition(fileFrom: AventusBaseFile, positionFrom: Position, fileTo: AventusBaseFile, offset: number): Position {
        let currentOffset = fileFrom.file.documentInternal.offsetAt(positionFrom);
        return fileTo.file.documentInternal.positionAt(currentOffset - offset);
    }
    private isOverlapping(rangeSelected: { start: number, end: number }, rangeSection: { start: number, end: number }): boolean {
        return (rangeSection.start < rangeSelected.start && rangeSection.end > rangeSelected.start) ||
            (rangeSection.start < rangeSelected.end && rangeSection.end > rangeSelected.end) ||
            (rangeSection.start > rangeSelected.start && rangeSection.end < rangeSelected.end)
    }



    public static getRegion(file: AventusFile): SplittedTxt {
        let regexScript = /<script>((\s|\S)*)<\/script>/g;
        let regexTemplate = /<template>((\s|\S)*)<\/template>/g;
        let regexStyle = /<style>((\s|\S)*)<\/style>/g;

        let resultTxt: SplittedTxt = {
            cssText: null,
            htmlText: null,
            scriptText: null
        }

        let scriptMatch = regexScript.exec(file.contentInternal);
        if (scriptMatch) {
            let startIndex = scriptMatch.index + 8;
            let endIndex = scriptMatch.index + scriptMatch[0].length - 9;
            resultTxt.scriptText = file.contentInternal.substring(startIndex, endIndex)
        }

        let styleMatch = regexStyle.exec(file.contentInternal);
        if (styleMatch) {
            let startIndex = styleMatch.index + 7;
            let endIndex = styleMatch.index + styleMatch[0].length - 8;
            resultTxt.cssText = file.contentInternal.substring(startIndex, endIndex)
        }

        let htmlMatch = regexTemplate.exec(file.contentInternal);
        if (htmlMatch) {
            let startIndex = htmlMatch.index + 10;
            let endIndex = htmlMatch.index + htmlMatch[0].length - 11;
            resultTxt.htmlText = file.contentInternal.substring(startIndex, endIndex)
        }

        return resultTxt;
    }

    protected onGetBuild(): Build[] {
        return [this.build]
    }
}