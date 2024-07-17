import { Position, CompletionList, CompletionItem, Hover, Definition, Range, FormattingOptions, TextEdit, CodeAction, Diagnostic, Location, CodeLens, WorkspaceEdit } from "vscode-languageserver";
import { AventusExtension } from "../../../definition";
import { AventusFile } from '../../../files/AventusFile';
import { AventusTsFile } from "../File";
import { Build } from '../../../project/Build';

export class AventusDefinitionFile extends AventusTsFile {
    public get extension(): string {
        return AventusExtension.Definition;
    }
    public constructor(file: AventusFile, build: Build) {
        super(file, build);
        this._contentForLanguageService = this.file.contentUser;
    }
    protected async onContentChange(): Promise<void> {
        this._contentForLanguageService = this.file.contentUser;
    }
    protected async onValidate(): Promise<Diagnostic[]> {
        return [];
        // return this.build.tsLanguageService.doValidation(this.file);
    }
    protected async onSave(): Promise<void> {

    }
    protected async onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
        return this.build.tsLanguageService.doComplete(document, position);
    }
    protected async onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem> {
        return item;
    }
    protected async onHover(document: AventusFile, position: Position): Promise<Hover | null> {
        return null;
    }
    protected async onDefinition(document: AventusFile, position: Position): Promise<Definition | null> {
        return null;
    }
    protected async onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
        return this.build.tsLanguageService.format(document, range, options);
    }
    protected async onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
        return []
    }
    protected async onReferences(document: AventusFile, position: Position): Promise<Location[]> {
        return []
    }
    protected async onCodeLens(document: AventusFile): Promise<CodeLens[]> {
        return [];
    }
    protected async onRename(document: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null> {
        return this.build.tsLanguageService.onRename(document, position, newName);
    }

}