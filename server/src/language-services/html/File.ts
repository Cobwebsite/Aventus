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
import { ContextEditing, ForLoop, IfInfo, IfInfoCondition } from './parser/TagInfo';
import { ClassInfo } from '../ts/parser/ClassInfo';
import { OverrideViewDecorator } from '../ts/parser/decorators/OverrideViewDecorator';

export type SlotsInfo = { [name: string]: { local?: boolean, doc?: string } }

type HtmlCodeAction = (CodeAction & { range: { start: number, end: number } })

export class AventusHTMLFile extends AventusBaseFile {

    public fileParsed: ParserHtml | undefined;
    public tsErrors: Diagnostic[] = [];
    private version: number = -1;
    private codeactions: HtmlCodeAction[] = [];

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
    private _slotsInfo: SlotsInfo | undefined;
    private slotsInfoVersion: number = 0;
    public get slotsInfo(): SlotsInfo {
        if (this.slotsInfoVersion != this.file.versionInternal || !this._slotsInfo) {
            this._slotsInfo = this.getSlotsInfo();
            this.slotsInfoVersion = this.file.versionInternal
        }
        return this._slotsInfo;
    }
    constructor(file: AventusFile, build: Build) {
        super(file, build);
    }

    public async init(): Promise<void> {
        await this.refreshFileParsed();
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
        this.codeactions = [];
        for (let diag of diagnostics) {
            if (diag.message.endsWith("keyof AventusI18n'.")) {
                const txt = this.file.documentUser.getText(diag.range).slice(1, -1);
                let codeAction: HtmlCodeAction = {
                    title: "Add value into translation file",
                    command: {
                        command: "aventus.i18n.add",
                        title: "Add value into translation file",
                        arguments: [this.file.uri, txt]
                    },
                    diagnostics: [diag],
                    range: {
                        start: this.file.documentUser.offsetAt(diag.range.start),
                        end: this.file.documentUser.offsetAt(diag.range.end),
                    }
                }
                this.codeactions.push(codeAction)
            }
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
        return this.build.htmlLanguageService.doComplete(this, position);
    }
    protected async onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem> {
        return item;
    }
    public async getHover(offset: number): Promise<Hover | null> {
        return this.onHover(this.file, this.file.documentUser.positionAt(offset));
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
        await this.compile();
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
            replacements['<' + ForLoop.tagName + ' id="' + key + '">'] = txt;
        }
        for (let loop of this.fileParsed.loops) {
            if (!mapLoop.has(loop)) {
                replacements['<' + ForLoop.tagName + ' id="' + loop.idTemplate + '">'] = loop.loopTxt.slice(0, loop.loopTxt.length - 1);
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
            replacements['<' + IfInfo.tagName + ' id="' + key + '">'] = txt;
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
                    replacements['<' + IfInfo.tagName + ' id="' + condition.idTemplate + '">'] = txt;
                }
            }
            if (_if.conditions.length != _if.idsTemplate.length) {
                replacements['<' + IfInfo.tagName + ' id="' + _if.idsTemplate[_if.idsTemplate.length - 1] + '">'] = 'else {';
            }
        }
        for (let edit of this.fileParsed.contextEdits) {
            let name = edit.mapping.length > 0 ? edit.mapping[0] : '';
            let src = edit.mapping.length > 1 ? edit.mapping[1] : '';
            let txt = '@Context(' + name + ', ' + src + ')'
            replacements['<' + ContextEditing.tagName + ' id="' + edit.id + '"></' + ContextEditing.tagName + '>'] = txt;
        }
        replacements['</' + ForLoop.tagName + '>'] = "}"
        replacements['</' + IfInfo.tagName + '>'] = "}"
        return replacements;
    }
    private async applyHtmlFormatting(file: AventusFile, range: Range, options: FormattingOptions, replacements: { [src: string]: string }): Promise<TextEdit[]> {
        if (!this.fileParsed) {
            return [];
        }
        let content = this.fileParsed?.compiledTxt
        let document = TextDocument.create(file.documentUser.uri, file.documentUser.languageId, file.documentUser.version, content);
        let result = await this.build.htmlLanguageService.format(document, range, options);
        let txt = result[0].newText;
        for (let src in replacements) {
            let regex = new RegExp(src.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g');
            txt = txt.replace(regex, replacements[src]);
        }
        txt = txt.replace(/\{\{ *([^\n][\s|\S]*?) *\n?\}\}/g, "{{ $1 }}")
        return [{
            newText: txt,
            range: {
                start: file.documentUser.positionAt(0),
                end: file.documentUser.positionAt(file.contentUser.length)
            }
        }]
    }

    protected async onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
        let start = document.documentUser.offsetAt(range.start);
        let end = document.documentUser.offsetAt(range.end);
        return this.codeactions.filter(p => p.range.start <= start && p.range.end >= end)
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

    protected getSlotsInfo(): SlotsInfo {
        const _class = this.tsFile?.fileParsed?.classes[this.tsFile.componentClassName] ?? null;
        if (_class) {
            return this.build.getSlotsInfo(_class);
        }
        return {}
    }
}