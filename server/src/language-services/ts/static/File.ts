import { existsSync, readFileSync } from 'fs';
import { Position, CompletionList, CompletionItem, Hover, Definition, Range, FormattingOptions, TextEdit, CodeAction, Diagnostic, Location, CodeLens, WorkspaceEdit } from "vscode-languageserver";
import { AventusExtension } from "../../../definition";
import { AventusFile } from '../../../files/AventusFile';
import { AventusTsFile } from "../File";
import { v4 as randomUUID } from 'uuid';

export class AventusStaticFile extends AventusTsFile {

    protected get extension(): string {
        return AventusExtension.Static;
    }
    protected override mustBeAddedToLanguageService(): boolean {
        return false;
    }
    protected async onValidate(): Promise<Diagnostic[]> {
        return [];
    }
    protected async onContentChange(): Promise<void> {

    }
    protected async onSave() {
        // if we write manually the filedoc, use it
        let currentPath = this.file.path;
        let definitionPath = currentPath.replace(this.extension, AventusExtension.Definition);
        let docVisible = "";
        if (definitionPath.endsWith(AventusExtension.Definition) && existsSync(definitionPath)) {
            docVisible = readFileSync(definitionPath, 'utf8').replace(/declare global \{((\s|\S)*)\}/gm, '$1');
        }
        this.setCompileResult([{
            classDoc: '',
            classScript: '!staticClass_' + randomUUID(),
            compiled: this.file.content,
            docVisible: docVisible,
            docInvisible: '',
            debugTxt: '',
            dependances: [],
            uri: this.file.uri,
            required: true,
            isData: false
        }]);
    }
    protected async onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
        return { isIncomplete: false, items: [] }
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
        return [];
    }
    protected async onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
        return [];
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
}