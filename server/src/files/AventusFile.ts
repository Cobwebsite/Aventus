import { TextDocument } from 'vscode-languageserver-textdocument';
import { CodeAction, CodeLens, CompletionItem, CompletionList, Definition, Diagnostic, FormattingOptions, Hover, Location, Position, Range, TextEdit, WorkspaceEdit } from "vscode-languageserver";
import { v4 as randomUUID } from 'uuid';
import { getFolder, uriToPath } from '../tools';
import { ClientConnection } from '../Connection';
import { Build } from '../project/Build';
import { AventusLanguageId } from '../definition';

export type onValidateType = (document: AventusFile) => Promise<Diagnostic[]>;
export type onContentChangeType = (document: AventusFile) => Promise<void>;
export type onCompletionType = (document: AventusFile, position: Position) => Promise<CompletionList>;
export type onCompletionResolveType = (document: AventusFile, item: CompletionItem) => Promise<CompletionItem>;
export type onHoverType = (document: AventusFile, position: Position) => Promise<Hover | null>;
export type onDefinitionType = (document: AventusFile, position: Position) => Promise<Definition | null>;
export type onFormattingType = (document: AventusFile, range: Range, options: FormattingOptions) => Promise<TextEdit[]>;
export type onCodeActionType = (document: AventusFile, range: Range) => Promise<CodeAction[]>;
export type onReferencesType = (document: AventusFile, position: Position) => Promise<Location[]>;
export type onCodeLensType = (document: AventusFile) => Promise<CodeLens[]>;
export type onRenameType = (document: AventusFile, position: Position, newName: string) => Promise<WorkspaceEdit | null>;
export type onGetBuildType = () => Build[];

export interface AventusFile {
    document: TextDocument;
    uri: string;
    path: string;
    version: number;
    content: string;
    folderUri: string;
    folderPath: string;
    shortname: string;

    getBuild(): Build[]
    onGetBuild(cb: onGetBuildType): string;
    removeOnGetBuild(uuid: string): void;

    validate(sendDiagnostics?: boolean): Promise<Diagnostic[]>;
    onValidate(cb: onValidateType): string;
    removeOnValidate(uuid: string): void;

    onContentChange(cb: onContentChangeType): string;
    removeOnContentChange(uuid: string): void;

    onSave(cb: (file: AventusFile) => Promise<void>): string;
    removeOnSave(uuid: string): void;

    onDelete(cb: (file: AventusFile) => Promise<void>): string;
    removeOnDelete(uuid: string): void;

    onCompletion(cb: onCompletionType): string;
    removeOnCompletion(uuid: string): void;

    onCompletionResolve(cb: onCompletionResolveType): string;
    removeOnCompletionResolve(uuid: string): void;

    onHover(cb: onHoverType): string;
    removeOnHover(uuid: string): void;

    onDefinition(cb: onDefinitionType): string;
    removeOnDefinition(uuid: string): void;

    onFormatting(cb: onFormattingType): string;
    removeOnFormatting(uuid: string): void;

    onCodeAction(cb: onCodeActionType): string;
    removeOnCodeAction(uuid: string): void;

    onReferences(cb: onReferencesType): string;
    removeOnReferences(uuid: string): void;

    onCodeLens(cb: onCodeLensType): string;
    removeOnCodeLens(uuid: string): void;

    onRename(cb: onRenameType): string;
    removeOnRename(uuid: string): void;
}
export class InternalAventusFile implements AventusFile {
    public document: TextDocument;

    public constructor(document: TextDocument) {
        this.document = document;
        this._version = this.document.version;
    }

    get uri() {
        return this.document.uri;
    }
    get path() {
        return uriToPath(this.document.uri);
    }
    private _version: number = 0;
    get version() {
        return this._version;
    }

    get content() {
        return this.document.getText();
    }
    get folderUri() {
        return getFolder(this.document.uri);
    }
    get folderPath() {
        return getFolder(this.path);
    }
    private _shortname: string = "";
    get shortname() {
        if (!this._shortname) {
            let splitted = this.uri.split("/");
            this._shortname = splitted[splitted.length - 1];
        }
        return this._shortname;

    }

    //#region get build
    private onGetBuildCb: { [uuid: string]: onGetBuildType } = {};

    public getBuild(): Build[] {
        let result: Build[] = [];
        for (let uuid in this.onGetBuildCb) {
            let builds = this.onGetBuildCb[uuid]();
            for (let build of builds) {
                if (result.indexOf(build) == -1) {
                    result.push(build);
                }
            }
        }
        return result;
    }

    public onGetBuild(cb: onGetBuildType): string {
        let uuid = randomUUID();
        while (this.onGetBuildCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onGetBuildCb[uuid] = cb;
        return uuid;
    }

    public removeOnGetBuild(uuid: string): void {
        delete this.onGetBuildCb[uuid];
    }
    //#endregion

    //#region validate

    private onValidateCb: { [uuid: string]: onValidateType } = {};
    public async validate(sendDiagnostics: boolean = true): Promise<Diagnostic[]> {
        let diagnostics: Diagnostic[] = [];
        for (let uuid in this.onValidateCb) {
            let diagTemp = await this.onValidateCb[uuid](this);
            diagnostics = [
                ...diagnostics,
                ...diagTemp
            ]
        }
        if (sendDiagnostics) {
            ClientConnection.getInstance().sendDiagnostics({ uri: this.uri, diagnostics: diagnostics })
        }
        return diagnostics;
    }
    public onValidate(cb: onValidateType): string {
        let uuid = randomUUID();
        while (this.onValidateCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onValidateCb[uuid] = cb;
        return uuid;
    }

    public removeOnValidate(uuid: string): void {
        delete this.onValidateCb[uuid];
    }

    //#endregion


    //#region content change

    private onContentChangeCb: { [uuid: string]: onContentChangeType } = {};
    private delayValidate: NodeJS.Timer | undefined;

    public async triggerContentChange(document: TextDocument) {
        this.document = document;
        this._version = this.document.version;
        let proms: Promise<void>[] = [];
        for (let uuid in this.onContentChangeCb) {
            proms.push(this.onContentChangeCb[uuid](this));
        }
        await Promise.all(proms);
        if (this.delayValidate) {
            clearTimeout(this.delayValidate);
        }
        this.delayValidate = setTimeout(async () => {
            this.validate();
        }, 500)
    }

    public onContentChange(cb: onContentChangeType): string {
        let uuid = randomUUID();
        while (this.onContentChangeCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onContentChangeCb[uuid] = cb;
        return uuid;
    }

    public removeOnContentChange(uuid: string): void {
        delete this.onContentChangeCb[uuid];
    }

    //#endregion

    //#region apply edit
    public applyTextEdits(transformations: TextEdit[]) {
        let content = this.document.getText();
        transformations.sort((a, b) => this.document.offsetAt(b.range.end) - this.document.offsetAt(a.range.end)); // order from end file to start file
        for (let transformation of transformations) {
            let start = this.document.offsetAt(transformation.range.start);
            let end = this.document.offsetAt(transformation.range.end);
            content = content.slice(0, start) + transformation.newText + content.slice(end, content.length);
        }
        let newDocument = TextDocument.create(this.uri, AventusLanguageId.TypeScript, this.version + 1, content);
        this.triggerContentChange(newDocument);
    }
    //#endregion

    //#region save

    private onSaveCb: { [uuid: string]: (document: AventusFile) => Promise<void> } = {};

    public async triggerSave(document: TextDocument): Promise<void> {
        this.document = document;
        for (let uuid in this.onSaveCb) {
            this.onSaveCb[uuid](this);
        }
    }

    public onSave(cb: (file: AventusFile) => Promise<void>): string {
        let uuid = randomUUID();
        while (this.onSaveCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onSaveCb[uuid] = cb;
        return uuid;
    }

    public removeOnSave(uuid: string): void {
        delete this.onSaveCb[uuid];
    }
    //#endregion

    //#region delete

    private onDeleteCb: { [uuid: string]: (document: AventusFile) => Promise<void> } = {};

    public async triggerDelete(): Promise<void> {
        let proms: Promise<void>[] = [];
        for (let uuid in this.onDeleteCb) {
            proms.push(this.onDeleteCb[uuid](this));
        }
        await Promise.all(proms);
        // delete all cb
        this.removeAllCallbacks();
    }
    private removeAllCallbacks() {
        this.onCodeActionCb = {};
        this.onCompletionCb = {};
        this.onCompletionResolveCb = {};
        this.onContentChangeCb = {};
        this.onDefinitionCb = {};
        this.onDeleteCb = {};
        this.onFormattingCb = {};
        this.onHoverCb = {};
        this.onSaveCb = {};
    }

    public onDelete(cb: (file: AventusFile) => Promise<void>): string {
        let uuid = randomUUID();
        while (this.onDeleteCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onDeleteCb[uuid] = cb;
        return uuid;
    }

    public removeOnDelete(uuid: string): void {
        delete this.onDeleteCb[uuid];
    }
    //#endregion


    //#region onCompletion
    private onCompletionCb: { [uuid: string]: onCompletionType } = {};

    public async getCompletion(position: Position): Promise<CompletionList> {
        let result: CompletionList = { isIncomplete: false, items: [] }
        let proms: Promise<CompletionList>[] = [];
        for (let uuid in this.onCompletionCb) {
            proms.push(this.onCompletionCb[uuid](this, position));
        }
        let promsResult = await Promise.all(proms);
        for (let promResult of promsResult) {
            result.items = [...result.items, ...promResult.items];
        }
        return result;
    }

    public onCompletion(cb: onCompletionType): string {
        let uuid = randomUUID();
        while (this.onCompletionCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onCompletionCb[uuid] = cb;
        return uuid;
    }

    public removeOnCompletion(uuid: string): void {
        delete this.onCompletionCb[uuid];
    }
    //#endregion

    //#region onCompletionResolve

    private onCompletionResolveCb: { [uuid: string]: onCompletionResolveType } = {};

    public async getCompletionResolve(item: CompletionItem): Promise<CompletionItem> {
        let result = item;

        let proms: Promise<CompletionItem>[] = [];
        for (let uuid in this.onCompletionResolveCb) {
            proms.push(this.onCompletionResolveCb[uuid](this, item));
        }
        // let promsResult = await Promise.all(proms);
        // actually the object is edited inside the methods => maybe it ll not work with other languageservice than TS

        // for (let promResult of promsResult) {
        //     if (promResult.additionalTextEdits) {
        //         if (!result.additionalTextEdits) {
        //             result.additionalTextEdits = [];
        //         }
        //         for (let additionalTextEdit of promResult.additionalTextEdits) {
        //             if (result.additionalTextEdits.indexOf(additionalTextEdit) != -1) {
        //                 result.additionalTextEdits.push(additionalTextEdit);
        //             }
        //         }
        //     }
        // }
        return result;
    }

    public onCompletionResolve(cb: onCompletionResolveType): string {
        let uuid = randomUUID();
        while (this.onCompletionResolveCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onCompletionResolveCb[uuid] = cb;
        return uuid;
    }

    public removeOnCompletionResolve(uuid: string): void {
        delete this.onCompletionResolveCb[uuid];
    }
    //#endregion

    //#region onHover
    private onHoverCb: { [uuid: string]: onHoverType } = {};

    public async getHover(position: Position): Promise<Hover | null> {
        let proms: Promise<Hover | null>[] = [];
        for (let uuid in this.onHoverCb) {
            proms.push(this.onHoverCb[uuid](this, position));
        }
        let promsResult = await Promise.all(proms);
        for (let promResult of promsResult) {
            if (promResult) {
                return promResult;
            }
        }
        return null;
    }

    public onHover(cb: onHoverType): string {
        let uuid = randomUUID();
        while (this.onHoverCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onHoverCb[uuid] = cb;
        return uuid;
    }

    public removeOnHover(uuid: string): void {
        delete this.onHoverCb[uuid];
    }
    //#endregion

    //#region onDefinition
    private onDefinitionCb: { [uuid: string]: onDefinitionType } = {};

    public async getDefinition(position: Position): Promise<Definition | null> {
        let proms: Promise<Definition | null>[] = [];
        for (let uuid in this.onDefinitionCb) {
            proms.push(this.onDefinitionCb[uuid](this, position));
        }
        let promsResult = await Promise.all(proms);
        for (let promResult of promsResult) {
            if (promResult) {
                return promResult;
            }
        }
        return null;
    }

    public onDefinition(cb: onDefinitionType): string {
        let uuid = randomUUID();
        while (this.onDefinitionCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onDefinitionCb[uuid] = cb;
        return uuid;
    }

    public removeOnDefinition(uuid: string): void {
        delete this.onDefinitionCb[uuid];
    }
    //#endregion

    //#region onFormatting
    private onFormattingCb: { [uuid: string]: onFormattingType } = {};

    public async getFormatting(options: FormattingOptions): Promise<TextEdit[]> {
        let result: TextEdit[] = [];
        let proms: Promise<TextEdit[]>[] = [];
        let range = {
            start: this.document.positionAt(0),
            end: this.document.positionAt(this.document.getText().length)
        };
        for (let uuid in this.onFormattingCb) {
            proms.push(this.onFormattingCb[uuid](this, range, options));
        }
        let promsResult = await Promise.all(proms);
        for (let promResult of promsResult) {
            result = [...result, ...promResult];
        }
        return result;
    }

    public onFormatting(cb: onFormattingType): string {
        let uuid = randomUUID();
        while (this.onFormattingCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onFormattingCb[uuid] = cb;
        return uuid;
    }

    public removeOnFormatting(uuid: string): void {
        delete this.onFormattingCb[uuid];
    }
    //#endregion

    //#region onCodeAction
    private onCodeActionCb: { [uuid: string]: onCodeActionType } = {};

    public async getCodeAction(range: Range): Promise<CodeAction[]> {
        let result: CodeAction[] = [];
        let proms: Promise<CodeAction[]>[] = [];
        for (let uuid in this.onCodeActionCb) {
            proms.push(this.onCodeActionCb[uuid](this, range));
        }
        let promsResult = await Promise.all(proms);
        for (let promResult of promsResult) {
            result = [...result, ...promResult];
        }
        return result;
    }

    public onCodeAction(cb: onCodeActionType): string {
        let uuid = randomUUID();
        while (this.onCodeActionCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onCodeActionCb[uuid] = cb;
        return uuid;
    }

    public removeOnCodeAction(uuid: string): void {
        delete this.onCodeActionCb[uuid];
    }
    //#endregion

    //#region onReferences
    private onReferencesCb: { [uuid: string]: onReferencesType } = {};

    public async getReferences(position: Position): Promise<Location[]> {
        let result: Location[] = [];
        let proms: Promise<Location[]>[] = [];
        for (let uuid in this.onReferencesCb) {
            proms.push(this.onReferencesCb[uuid](this, position));
        }
        let promsResult = await Promise.all(proms);
        for (let promResult of promsResult) {
            result = [...result, ...promResult];
        }
        return result;
    }

    public onReferences(cb: onReferencesType): string {
        let uuid = randomUUID();
        while (this.onReferencesCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onReferencesCb[uuid] = cb;
        return uuid;
    }

    public removeOnReferences(uuid: string): void {
        delete this.onReferencesCb[uuid];
    }
    //#endregion

    //#region onCodeLens
    private onCodeLensCb: { [uuid: string]: onCodeLensType } = {};

    public async getCodeLens(): Promise<CodeLens[]> {
        let result: CodeLens[] = [];
        let proms: Promise<CodeLens[]>[] = [];
        for (let uuid in this.onCodeLensCb) {
            proms.push(this.onCodeLensCb[uuid](this));
        }
        let promsResult = await Promise.all(proms);
        for (let promResult of promsResult) {
            result = [...result, ...promResult];
        }
        return result;
    }

    public onCodeLens(cb: onCodeLensType): string {
        let uuid = randomUUID();
        while (this.onCodeLensCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onCodeLensCb[uuid] = cb;
        return uuid;
    }

    public removeOnCodeLens(uuid: string): void {
        delete this.onCodeLensCb[uuid];
    }
    //#endregion

    //#region onRename
    private onRenameCb: { [uuid: string]: onRenameType } = {};

    public async getRename(position: Position, newName: string): Promise<WorkspaceEdit | null> {
        let proms: Promise<WorkspaceEdit | null>[] = [];
        for (let uuid in this.onRenameCb) {
            proms.push(this.onRenameCb[uuid](this, position, newName));
        }
        let promsResult = await Promise.all(proms);
        for (let promResult of promsResult) {
            if(promResult) {
                return promResult
            }            
        }
        return null;
    }

    public onRename(cb: onRenameType): string {
        let uuid = randomUUID();
        while (this.onRenameCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onRenameCb[uuid] = cb;
        return uuid;
    }

    public removeOnRename(uuid: string): void {
        delete this.onRenameCb[uuid];
    }
    //#endregion
}