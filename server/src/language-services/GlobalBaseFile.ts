import { CodeAction, CodeLens, CompletionItem, CompletionList, Definition, Diagnostic, DiagnosticSeverity, FormattingOptions, Hover, Location, Position, Range, TextEdit, WorkspaceEdit } from "vscode-languageserver";
import { AventusFile, InternalAventusFile } from '../files/AventusFile';
import { Project } from '../project/Project';


export abstract class AventusGlobalBaseFile {
    protected _file: AventusFile;
    protected _project: Project;


    
    public get file() {
        return this._file;
    }
    public get project() {
        return this._project;
    }
    
    public constructor(file: AventusFile, project: Project) {
        this._file = file;
        this._project = project;
        this.addEvents();
    }


    private uuidEvents = {
        onContentChange: '',
        onValidate: '',
        onSave: '',
        onDelete: '',
        onCompletion: '',
        onCompletionResolve: '',
        onHover: '',
        onDefinition: '',
        onFormatting: '',
        onCodeAction: '',
        onReferences: '',
        onCodeLens: '',
        onRename: ''
    }
    private addEvents(): void {
        this.uuidEvents.onContentChange = this.file.onContentChange(this.onContentChange.bind(this));
        this.uuidEvents.onValidate = this.file.onValidate(this._onValidate.bind(this));
        this.uuidEvents.onSave = this.file.onSave(this.onSave.bind(this));
        this.uuidEvents.onDelete = this.file.onDelete(this._onDelete.bind(this));
        this.uuidEvents.onCompletion = this.file.onCompletion(this.onCompletion.bind(this));
        this.uuidEvents.onCompletionResolve = this.file.onCompletionResolve(this.onCompletionResolve.bind(this));
        this.uuidEvents.onHover = this.file.onHover(this.onHover.bind(this));
        this.uuidEvents.onDefinition = this.file.onDefinition(this.onDefinition.bind(this));
        this.uuidEvents.onFormatting = this.file.onFormatting(this.onFormatting.bind(this));
        this.uuidEvents.onCodeAction = this.file.onCodeAction(this.onCodeAction.bind(this));
        this.uuidEvents.onReferences = this.file.onReferences(this.onReferences.bind(this));
        this.uuidEvents.onCodeLens = this.file.onCodeLens(this.onCodeLens.bind(this));
        this.uuidEvents.onRename = this.file.onRename(this.onRename.bind(this));
    }
    public removeEvents(): void {
        this.file.removeOnContentChange(this.uuidEvents.onContentChange);
        this.file.removeOnValidate(this.uuidEvents.onValidate);
        this.file.removeOnSave(this.uuidEvents.onSave);
        this.file.removeOnDelete(this.uuidEvents.onDelete);
        this.file.removeOnCompletion(this.uuidEvents.onCompletion);
        this.file.removeOnCompletionResolve(this.uuidEvents.onCompletionResolve);
        this.file.removeOnHover(this.uuidEvents.onHover);
        this.file.removeOnDefinition(this.uuidEvents.onDefinition);
        this.file.removeOnFormatting(this.uuidEvents.onFormatting);
        this.file.removeOnCodeAction(this.uuidEvents.onCodeAction);
        this.file.removeOnReferences(this.uuidEvents.onReferences);
        this.file.removeOnCodeLens(this.uuidEvents.onCodeLens);
        this.file.removeOnRename(this.uuidEvents.onRename);

    }

    public async validate() {
        if (this.file instanceof InternalAventusFile) {
            await this.file.validate();
        }
    }
    public triggerSave(): void {
        if (this.file instanceof InternalAventusFile) {
            this.file.triggerSave();
        }
    }
    public async triggerContentChange(): Promise<void> {
        if (this.file instanceof InternalAventusFile) {
            await this.file.triggerContentChange(this.file.documentUser);
        }
    }
    protected abstract onContentChange(): Promise<void>;
    private async _onValidate(): Promise<Diagnostic[]> {
        let result = await this.onValidate();
        return result;
    }
    protected abstract onValidate(): Promise<Diagnostic[]>;
    protected abstract onSave(): Promise<void>;
    protected abstract onDelete(): Promise<void>;
    private async _onDelete(): Promise<void> {
        await this.onDelete();
        this.removeEvents();
    }

    protected abstract onCompletion(document: AventusFile, position: Position): Promise<CompletionList>;
    protected abstract onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem>;
    protected abstract onHover(document: AventusFile, position: Position): Promise<Hover | null>;
    protected abstract onDefinition(document: AventusFile, position: Position): Promise<Definition | null>;
    protected abstract onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]>;
    protected abstract onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]>;
    protected abstract onReferences(document: AventusFile, position: Position): Promise<Location[]>;
    protected abstract onCodeLens(document: AventusFile): Promise<CodeLens[]>;
    protected abstract onRename(document: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null>;


}