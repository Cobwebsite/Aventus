import { Position, CompletionList, CompletionItem, Hover, Definition, Range, FormattingOptions, TextEdit, CodeAction, Diagnostic, Location, CodeLens, WorkspaceEdit } from "vscode-languageserver";
import { AventusExtension } from '../../definition';
import { AventusFile } from '../../files/AventusFile';
import { Build } from '../../project/Build';
import { AventusBaseFile } from "../BaseFile";
import { AventusWebComponentLogicalFile } from '../ts/component/File';
import { ParserHtml } from './parser/ParserHtml';
import { AventusWebSCSSFile } from '../scss/File';

export class AventusHTMLFile extends AventusBaseFile {

    public fileParsed: ParserHtml | undefined;
    public tsErrors: Diagnostic[] = [];
    private version: number = 0;

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
        this.compile(false);
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
        return diagnostics;
    }
    protected async onContentChange(): Promise<void> {
    }
    protected async onSave() {
        this.compile();
    }
    private compile(triggerSave = true) {
        try {
            if (this.refreshFileParsed()) {
                let tsFile = this.tsFile;
                if (tsFile && triggerSave) {
                    tsFile.validate();
                    tsFile.triggerSave();
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
    protected async onDelete() {

    }
    protected async onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
        return await this.build.htmlLanguageService.doComplete(document, position);
    }
    protected async onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem> {
        return item;
    }
    protected onHover(document: AventusFile, position: Position): Promise<Hover | null> {
        return this.build.htmlLanguageService.doHover(this, position);
    }
    protected async onDefinition(document: AventusFile, position: Position): Promise<Definition | null> {
        return this.build.htmlLanguageService.onDefinition(this, position);
    }
    protected async onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
        return this.build.htmlLanguageService.format(document, range, options);
    }
    protected async onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
        return [];
    }
    protected async onReferences(document: AventusFile, position: Position): Promise<Location[]> {
        return this.build.htmlLanguageService.getLinkToStyle(this, position);
    }
    protected async onCodeLens(document: AventusFile): Promise<CodeLens[]> {
        return [];
    }
    protected onGetBuild(): Build[] {
        return [this.build]
    }
    protected async onRename(document: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null> {
        return null;
    }
}