import { existsSync, readFileSync } from 'fs';
import { Position, CompletionList, CompletionItem, Hover, Range, FormattingOptions, TextEdit, CodeAction, Diagnostic, Location, CodeLens, WorkspaceEdit } from "vscode-languageserver";
import { AventusExtension } from "../../../definition";
import { AventusFile } from '../../../files/AventusFile';
import { AventusTsFile } from "../File";
import { InfoType } from '../parser/BaseInfo';
import { createHash } from 'crypto';

export class AventusStaticFile extends AventusTsFile {

    public get extension(): string {
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
        let docNpm = "";
        if (definitionPath.endsWith(AventusExtension.Definition) && existsSync(definitionPath)) {
            docVisible = readFileSync(definitionPath, 'utf8').replace(/declare global \{((\s|\S)*)\}/gm, '$1');
        }
        let definitionNpmPath = currentPath.replace(this.extension, AventusExtension.DefinitionNpm);
        if (definitionNpmPath.endsWith(AventusExtension.DefinitionNpm) && existsSync(definitionNpmPath)) {
            docNpm = readFileSync(definitionNpmPath, 'utf8')
        }
        else {
            docNpm = docVisible;
        }
        let hash = createHash('md5').update(currentPath + this.file.contentUser).digest('hex');
        let pathFileTemp = this.file.path.replace(this.build.project.getConfigFile().path.replace(AventusExtension.Config, ""), "")
        pathFileTemp = pathFileTemp.replace(this.extension, ".js");

        this.setCompileResult([{
            classDoc: '',
            classScript: '!staticClass_' + hash,
            compiled: this.file.contentUser,
            hotReload: '',
            docVisible: docVisible,
            npm: {
                namespace: "",
                defTs: docNpm,
                src: this.file.contentUser,
                exportPath: pathFileTemp,
                uri: this.file.uri
            },
            docInvisible: '',
            debugTxt: '',
            dependances: [],
            uri: this.file.uri,
            required: true,
            type: InfoType.none,
            isExported: {
                external: false,
                internal: false
            }, // actually its exported if written correctly
            convertibleName: '',
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
    protected async onDefinition(document: AventusFile, position: Position): Promise<Location[] | null> {
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