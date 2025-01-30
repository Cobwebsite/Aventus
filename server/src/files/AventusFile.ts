import { TextDocument } from 'vscode-languageserver-textdocument';
import { CodeAction, CodeLens, CompletionItem, CompletionList, Definition, Diagnostic, FormattingOptions, Hover, Location, Position, Range, TextEdit, WorkspaceEdit } from "vscode-languageserver";
import { v4 as randomUUID } from 'uuid';
import { getFolder, uriToPath } from '../tools';
import { Build } from '../project/Build';
import { AventusLanguageId } from '../definition';
import { GenericServer } from '../GenericServer';
import { SettingsManager } from '../settings/Settings';

export type onValidateType = (document: AventusFile) => Promise<Diagnostic[]>;
export type onCanContentChangeType = (document: TextDocument) => boolean;
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
export type onGetBuildType = () => Build[] | null;
export type onGetFileApplyTextEditsType = () => TextDocument;

export interface AventusFile {
    readonly documentUser: TextDocument;
    readonly documentInternal: TextDocument;
    uri: string;
    path: string;
    name: string;
    versionUser: number;
    versionInternal: number;
    contentUser: string;
    contentInternal: string;
    folderUri: string;
    folderPath: string;
    shortname: string;
    linkInternalAndUser: boolean;

    getBuild(): Build[] | null
    onGetBuild(cb: onGetBuildType): string;
    removeOnGetBuild(uuid: string): void;

    validate(sendDiagnostics?: boolean): Promise<Diagnostic[]>;
    onValidate(cb: onValidateType): string;
    removeOnValidate(uuid: string): void;

    onCanContentChange(cb: onCanContentChangeType): string;
    removeOnCanContentChange(uuid: string): void;

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
    private _documentUser: TextDocument;
    private _documentInternal: TextDocument;

    public get documentUser(): TextDocument {
        return this._documentUser;
    }
    public get documentInternal(): TextDocument {
        return this._documentInternal;
    }

    public linkInternalAndUser: boolean = true;

    public setDocumentInternal(value: TextDocument) {
        this._documentInternal = value;
        this._versionInternal = value.version;
    }

    public constructor(document: TextDocument) {
        this._documentUser = document;
        this._documentInternal = document;
        this._versionUser = document.version;
        this._versionInternal = document.version;
    }

    get uri() {
        return this.documentUser.uri;
    }
    get path() {
        return uriToPath(this.uri);
    }
    get name() {
        return this.path.split("/").pop() ?? '';
    }
    private _versionUser: number = 0;
    get versionUser() {
        return this._versionUser;
    }
    private _versionInternal: number = 0;
    get versionInternal() {
        return this._versionInternal;
    }

    get contentUser() {
        return this.documentUser.getText()
    }
    get contentInternal() {
        return this.documentInternal.getText()
    }
    get folderUri() {
        return getFolder(this.uri);
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

    public getBuild(): Build[] | null {
        let result: Build[] = [];
        let hasNull = false;
        for (let uuid in this.onGetBuildCb) {
            let builds = this.onGetBuildCb[uuid]();
            if (builds === null) {
                hasNull = true;
            }
            else {
                for (let build of builds) {
                    if (result.indexOf(build) == -1) {
                        result.push(build);
                    }
                }
            }
        }
        if (result.length == 0 && hasNull) return null;
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
        let diagnostics: { [key: string]: Diagnostic } = {};
        for (let uuid in this.onValidateCb) {
            let diagTemps = await this.onValidateCb[uuid](this);

            for (let diagTemp of diagTemps) {
                let key = diagTemp.message + "**" + diagTemp.range.start.line + ":" + diagTemp.range.start.character + "," + diagTemp.range.end.line + ":" + diagTemp.range.end.character;
                if (!diagnostics[key]) {
                    diagnostics[key] = diagTemp;
                }
            }
        }
        if (sendDiagnostics) {
            if (SettingsManager.getInstance().settings.errorByBuild) {
                const builds = this.getBuild();
                if (builds == null) {
                    GenericServer.sendDiagnostics({ uri: this.uri, diagnostics: Object.values(diagnostics) })
                }
                else {
                    for (let build of builds) {
                        GenericServer.sendDiagnostics({ uri: this.uri, diagnostics: Object.values(diagnostics) }, build);
                    }
                }
            }
            else {
                GenericServer.sendDiagnostics({ uri: this.uri, diagnostics: Object.values(diagnostics) })
            }
        }
        return Object.values(diagnostics);
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
    private delayValidate: NodeJS.Timeout | undefined;
    private waitingDocContentChange: { [uri: string]: TextDocument | true } = {};
    private resolveContentChange: { [uri: string]: { [version: number]: (() => void)[] } } = {};


    public triggerContentChange(document: TextDocument): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.triggerCanContentChange(document)) {
                resolve();
                return;
            }
            setTimeout(() => {
                if (!this.waitingDocContentChange[document.uri]) {
                    this.waitingDocContentChange[document.uri] = true;
                    this.resolveContentChange[document.uri] = {
                        [document.version]: [resolve]
                    };
                    this.triggerContentChangeNoBuffer(document);
                }
                else {
                    if (!this.resolveContentChange[document.uri]) {
                        this.resolveContentChange[document.uri] = {};
                    }
                    if (!this.resolveContentChange[document.uri][document.version]) {
                        this.resolveContentChange[document.uri][document.version] = []
                    }
                    this.resolveContentChange[document.uri][document.version].push(resolve);
                    this.waitingDocContentChange[document.uri] = document;
                }
            }, 0)
        })
    }

    private async triggerContentChangeNoBuffer(document: TextDocument) {
        let parsingVersion = document.version;
        this._documentUser = document;
        this._versionUser = document.version;
        if (this.linkInternalAndUser) {
            this._documentInternal = document;
            this._versionInternal = document.version;
        }

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
        if (this.resolveContentChange[document.uri]) {
            let versions = Object.keys(this.resolveContentChange[document.uri]);
            for (let version of versions) {
                let v = Number(version);
                if (v > parsingVersion) {
                    break;
                }
                if (this.resolveContentChange[document.uri][version]) {
                    for (let resolve of this.resolveContentChange[document.uri][version]) {
                        resolve();
                    }
                    delete this.resolveContentChange[document.uri][version];
                }
            }
            if (Object.keys(this.resolveContentChange[document.uri]).length == 0) {
                delete this.resolveContentChange[document.uri];
            }
        }

        let newDoc = this.waitingDocContentChange[document.uri];
        if (newDoc && typeof newDoc != 'boolean') {
            this.waitingDocContentChange[document.uri] = true;
            this.triggerContentChangeNoBuffer(newDoc);
        }
        else {
            delete this.waitingDocContentChange[document.uri];
        }
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

    private onCanContentChangeCb: { [uuid: string]: onCanContentChangeType } = {};
    public triggerCanContentChange(document: TextDocument): boolean {
        for (let uuid in this.onCanContentChangeCb) {
            if (!this.onCanContentChangeCb[uuid](document)) {
                return false;
            }
        }
        return true;
    }
    public onCanContentChange(cb: onCanContentChangeType): string {
        let uuid = randomUUID();
        while (this.onCanContentChangeCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onCanContentChangeCb[uuid] = cb;
        return uuid;
    }
    public removeOnCanContentChange(uuid: string): void {
        delete this.onCanContentChangeCb[uuid];
    }

    //#endregion

    //#region apply edit
    public async applyTextEdits(transformations: TextEdit[]) {
        let content = this.contentUser;
        transformations.sort((a, b) => this.documentUser.offsetAt(b.range.end) - this.documentUser.offsetAt(a.range.end)); // order from end file to start file
        for (let transformation of transformations) {
            let start = this.documentUser.offsetAt(transformation.range.start);
            let end = this.documentUser.offsetAt(transformation.range.end);
            content = content.slice(0, start) + transformation.newText + content.slice(end, content.length);
        }
        let newDocument = TextDocument.create(this.uri, AventusLanguageId.TypeScript, this.documentUser.version + 1, content);
        await this.triggerContentChange(newDocument);
    }
    //#endregion

    //#region save

    private onSaveCb: { [uuid: string]: (document: AventusFile) => Promise<void> } = {};

    public async triggerSave(): Promise<void> {
        for (let uuid in this.onSaveCb) {
            await this.onSaveCb[uuid](this);
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
        let items: { [key: string]: CompletionItem } = {};
        for (let promResult of promsResult) {
            for (let item of promResult.items) {
                let key = JSON.stringify(item);
                if (!items[key]) {
                    items[key] = item;
                }
            }

        }
        result.items = Object.values(items);
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
        let result: { [key: string]: TextEdit } = {};
        let proms: Promise<TextEdit[]>[] = [];
        let range = {
            start: this.documentUser.positionAt(0),
            end: this.documentUser.positionAt(this.documentUser.getText().length)
        };
        for (let uuid in this.onFormattingCb) {
            proms.push(this.onFormattingCb[uuid](this, range, options));
        }
        let promsResult = await Promise.all(proms);
        for (let promResult of promsResult) {
            for (let textEdit of promResult) {
                let key = JSON.stringify(textEdit);
                if (!result[key]) {
                    result[key] = textEdit;
                }
            }
        }
        return Object.values(result);
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
            if (promResult) {
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