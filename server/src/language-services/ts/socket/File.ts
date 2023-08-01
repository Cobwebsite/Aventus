import { Position, CompletionList, CompletionItem, Hover, Definition, Range, FormattingOptions, TextEdit, CodeAction, Diagnostic, Location, CodeLens, WorkspaceEdit } from "vscode-languageserver";
import { AventusExtension } from "../../../definition";
import { AventusFile } from '../../../files/AventusFile';
import { Build } from '../../../project/Build';
import { genericTsCompile } from "../compiler";
import { AventusTsFile } from "../File";

export class AventusSocketFile extends AventusTsFile {

    protected get extension(): string {
        return AventusExtension.Socket;
    }
    constructor(file: AventusFile, build: Build) {
        super(file, build);
        this.refreshFileParsed();
    }
    protected async onValidate(): Promise<Diagnostic[]> {
        this.diagnostics = this.tsLanguageService.doValidation(this.file);
        if (this.fileParsed) {
            this.diagnostics = this.diagnostics.concat(this.fileParsed.errors)
        }
        if (this.build.isCoreBuild) {
            this.validateRules({
                allow_variables: false,
                allow_function: false,
                class_implement: ['ISocket']
            })
        }
        else {
            this.validateRules({
                allow_variables: false,
                allow_function: false,
                class_implement: ['Aventus.ISocket']
            })
        }
        return this.diagnostics;
    }
    protected async onContentChange(): Promise<void> {
        this.refreshFileParsed();
    }
    protected async onSave() {
        this.setCompileResult(genericTsCompile(this));
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
    protected onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
        return this.tsLanguageService.doCodeAction(document, range);
    }
    protected onReferences(document: AventusFile, position: Position): Promise<Location[]> {
        return this.tsLanguageService.onReferences(document, position);
    }
    protected onCodeLens(document: AventusFile): Promise<CodeLens[]> {
        return this.tsLanguageService.onCodeLens(document);
    }
    protected async onRename(document: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null> {
        return this.tsLanguageService.onRename(document, position, newName);
    }
}