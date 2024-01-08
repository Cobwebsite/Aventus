import { Position, CompletionList, CompletionItem, Hover, Definition, Range, FormattingOptions, TextEdit, CodeAction, Diagnostic, Location, CodeLens, WorkspaceEdit } from "vscode-languageserver";
import { AventusExtension, AventusLanguageId, AventusType } from '../../definition';
import { AventusFile } from '../../files/AventusFile';
import { Build } from '../../project/Build';
import { AventusBaseFile } from "../BaseFile";
import { AventusWebComponentLogicalFile } from '../ts/component/File';
import { ParserHtml } from './parser/ParserHtml';
import { AventusWebSCSSFile } from '../scss/File';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ActionChange } from './parser/definition';
import { ForLoop, IfInfoCondition } from './parser/TagInfo';


export class AventusHTMLFile extends AventusBaseFile {

    public fileParsed: ParserHtml | undefined;
    public tsErrors: Diagnostic[] = [];
    private version: number = -1;

    public get compiledVersion() {
        return this.version;
    }
    public get tsFile(): AventusWebComponentLogicalFile | null {
        let tsFile = this.build.tsFiles[this.file.uri.replace(AventusExtension.ComponentView, AventusExtension.ComponentLogic)];
        if (tsFile instanceof AventusWebComponentLogicalFile) {
            return tsFile;
        }
        return null;
    }
    public get scssFile(): AventusWebSCSSFile | null {
        let file = this.build.scssFiles[this.file.uri.replace(AventusExtension.ComponentView, AventusExtension.ComponentStyle)];
        if (file instanceof AventusWebSCSSFile) {
            return file;
        }
        return null;
    }
    constructor(file: AventusFile, build: Build) {
        super(file, build);
    }

    public async init(): Promise<void> {
        await this.compile();
    }
    /**
     * return true if doc changed
     */
    protected refreshFileParsed(): boolean {
        this.fileParsed = ParserHtml.parse(this, this.build);
        let newVersion = ParserHtml.getVersion(this);
        if (this.version != newVersion) {
            this.version = newVersion;
            this.file.validate();
            return true;
        }
        return false;
    }

    protected async onValidate(): Promise<Diagnostic[]> {
        let diagnostics = await this.build.htmlLanguageService.doValidation(this.file);
        if (this.fileParsed) {
            diagnostics = [...diagnostics, ...this.fileParsed.errors]
        }
        diagnostics = [...diagnostics, ...this.tsErrors]
        if (this.tsFile) {
            diagnostics = [...diagnostics, ...this.tsFile.htmlDiagnostics]
        }
        return diagnostics;
    }
    protected async onContentChange(): Promise<void> {
        await this.compile();
    }
    protected async onSave() {
        await this.tsFile?.triggerSave();
    }
    private async compile() {
        try {
            if (this.refreshFileParsed()) {
                await this.tsFile?.validate();
            }
        } catch (e) {
            console.error(e);
        }
    }
    protected async onDelete() {

    }
    protected async onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
        let resultTemp = await this.tsFile?.doViewCompletion(position)
        if (resultTemp) {
            return resultTemp;
        }
        return this.build.htmlLanguageService.doComplete(document, position);
    }
    protected async onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem> {
        return item;
    }
    protected async onHover(document: AventusFile, position: Position): Promise<Hover | null> {
        let resultTemp = await this.tsFile?.doHover(position)
        if (resultTemp) {
            return resultTemp;
        }
        return await this.build.htmlLanguageService.doHover(this, position);
    }
    protected async onDefinition(document: AventusFile, position: Position): Promise<Definition | null> {
        let resultTemp = await this.tsFile?.doDefinition(position)
        if (resultTemp) {
            return resultTemp;
        }
        return this.build.htmlLanguageService.onDefinition(this, position);
    }
    protected async onFormatting(file: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
        let replacements = await this.applyJsFormatting(range, options);
        return this.applyHtmlFormatting(file, range, options, replacements);
    }
    private async applyJsFormatting(range: Range, options: FormattingOptions): Promise<{ [src: string]: string }> {
        let resultJs = await this.tsFile?.doFormatting(range, options) ?? [];

        if (!this.fileParsed) {
            return {};
        }
        let mapFct: Map<ActionChange, { txt: string, start: number, end: number }[]> = new Map();
        let mapLoop: Map<ForLoop, { txt: string, start: number, end: number }[]> = new Map();
        let mapCondition: Map<IfInfoCondition, { txt: string, start: number, end: number }[]> = new Map();
        for (let format of resultJs) {
            if (format.kind == "fct") {
                for (let fctHash in this.fileParsed.fcts) {
                    let fct = this.fileParsed.fcts[fctHash];
                    if (fct.positions.find(p => p.start == format.start && p.end == format.end)) {
                        let array = mapFct.get(fct);
                        if (!array) {
                            array = []
                            mapFct.set(fct, array);
                        }
                        array.push({
                            start: format.edit.range.start - format.start,
                            end: format.edit.range.end - format.start,
                            txt: format.edit.newText
                        })
                        break;
                    }
                }
            }
            else if (format.kind == "loop") {
                for (let loop of this.fileParsed.loops) {
                    if (loop.start == format.start && loop.startBlock == format.end) {
                        let array = mapLoop.get(loop);
                        if (!array) {
                            array = []
                            mapLoop.set(loop, array);
                        }
                        array.push({
                            start: format.edit.range.start - format.start,
                            end: format.edit.range.end - format.start,
                            txt: format.edit.newText
                        })
                    }
                }
            }
            else if (format.kind == "if") {
                for (let _if of this.fileParsed.ifs) {
                    for (let condition of _if.conditions) {
                        if (condition.start == format.start && condition.end == format.end) {
                            let array = mapCondition.get(condition);
                            if (!array) {
                                array = []
                                mapCondition.set(condition, array);
                            }
                            array.push({
                                start: format.edit.range.start - format.start,
                                end: format.edit.range.end - format.start,
                                txt: format.edit.newText
                            })
                        }
                    }
                }
            }
        }
        let replacements: { [src: string]: string } = {}
        for (let [key, transformations] of mapFct) {
            let src = "{{" + key.txt + "}}";
            replacements[src] = src;
            transformations.sort((a, b) => b.end - a.end);
            for (let transformation of transformations) {
                replacements[src] = replacements[src].slice(0, transformation.start) + transformation.txt + replacements[src].slice(transformation.end);
            }
        }
        for (let [loop, transformations] of mapLoop) {
            let key = loop.idTemplate;
            let txt = loop.loopTxt;
            transformations.sort((a, b) => b.end - a.end);
            for (let transformation of transformations) {
                txt = txt.slice(0, transformation.start) + transformation.txt + txt.slice(transformation.end);
            }
            txt = txt.slice(0, txt.length - 1)
            replacements['<l id="' + key + '">'] = txt;
        }
        for(let loop of this.fileParsed.loops) {
            if(!mapLoop.has(loop)) {
                replacements['<l id="' + loop.idTemplate + '">'] = loop.loopTxt.slice(0, loop.loopTxt.length - 1);
            }
        }
        for (let [condition, transformations] of mapCondition) {
            let key = condition.idTemplate;
            let txt = condition.txt;
            transformations.sort((a, b) => b.end - a.end);
            for (let transformation of transformations) {
                txt = txt.slice(0, transformation.start) + transformation.txt + txt.slice(transformation.end);
            }
            if (condition.type == "if") {
                txt = 'if(' + txt + ') {'
            }
            else if (condition.type == "elif") {
                txt = 'else if(' + txt + ') {'
            }
            replacements['<i id="' + key + '">'] = txt;
        }
        for (let _if of this.fileParsed.ifs) {
            for (let condition of _if.conditions) {
                if (!mapCondition.has(condition)) {
                    let txt = condition.txt;
                    if (condition.type == "if") {
                        txt = 'if(' + txt + ') {'
                    }
                    else if (condition.type == "elif") {
                        txt = 'else if(' + txt + ') {'
                    }
                    replacements['<i id="' + condition.idTemplate + '">'] = txt;
                }
            }
            if(_if.conditions.length != _if.idsTemplate.length) {
                replacements['<i id="' + _if.idsTemplate[_if.idsTemplate.length - 1] + '">'] = 'else {';
            }
        }
        replacements['</l>'] = "}"
        replacements['</i>'] = "}"
        return replacements;
    }
    private async applyHtmlFormatting(file: AventusFile, range: Range, options: FormattingOptions, replacements: { [src: string]: string }): Promise<TextEdit[]> {
        if (!this.fileParsed) {
            return [];
        }
        let content = this.fileParsed?.compiledTxt
        let document = TextDocument.create(file.document.uri, file.document.languageId, file.document.version, content);
        let result = await this.build.htmlLanguageService.format(document, range, options);
        let txt = result[0].newText;
        for (let src in replacements) {
            let regex = new RegExp(src.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g');
            txt = txt.replace(regex, replacements[src]);
        }
        return [{
            newText: txt,
            range: {
                start: file.document.positionAt(0),
                end: file.document.positionAt(file.content.length)
            }
        }]
    }

    protected async onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
        return [];
    }
    protected async onReferences(document: AventusFile, position: Position): Promise<Location[]> {
        let resultTemp = await this.tsFile?.doReferences(position)
        if (resultTemp) {
            return resultTemp;
        }
        return this.build.htmlLanguageService.getLinkToStyle(this, position);
    }
    protected async onCodeLens(document: AventusFile): Promise<CodeLens[]> {
        return [];
    }
    protected onGetBuild(): Build[] {
        return [this.build]
    }
    protected async onRename(document: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null> {
        let resultTemp = await this.tsFile?.doRename(position, newName);
        if (resultTemp) {
            return resultTemp;
        }
        return null;
    }
}