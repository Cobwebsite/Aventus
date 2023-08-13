import { Position, CompletionList, CompletionItem, Hover, Definition, Range, FormattingOptions, TextEdit, CodeAction, Diagnostic, Location, CodeLens, WorkspaceEdit } from "vscode-languageserver";
import { AventusErrorCode, AventusExtension } from "../../../definition";
import { AventusFile } from '../../../files/AventusFile';
import { Build } from '../../../project/Build';
import { genericTsCompile } from "../compiler";
import { AventusTsFile } from "../File";
import { ClassInfo } from '../parser/ClassInfo';
import { createErrorTsPos } from '../../../tools';

export class AventusLibFile extends AventusTsFile {

    protected get extension(): string {
        return AventusExtension.Lib;
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
        this.validateRules({
            allow_variables: true,
            allow_function: true,
            customClassRules: [
                (classInfo) => {
                    if (!classInfo.isInterface && classInfo.convertibleName) {
                        if (!classInfo.hasStaticField(classInfo.convertibleName)) {
                            this.diagnostics.push(createErrorTsPos(this.file.document, `Missing static property ${classInfo.convertibleName}`, classInfo.nameStart, classInfo.nameEnd, AventusErrorCode.MissingFullName));
                        }
                    }
                }
            ]
        });
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