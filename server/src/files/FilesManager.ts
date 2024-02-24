import { existsSync, lstatSync, readdirSync, readFileSync } from 'fs';
import { Hover } from 'vscode-languageclient';
import { CodeAction, CodeLens, CompletionItem, CompletionList, Definition, FormattingOptions, Location, Position, Range, TextEdit, WorkspaceEdit } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusExtension, AventusLanguageId } from '../definition';
import { getLanguageIdByUri, pathToUri, uriToPath } from '../tools';
import { AventusFile, InternalAventusFile } from './AventusFile';
import { v4 as randomUUID } from 'uuid';
import { Build } from '../project/Build';
import { InitStep } from '../notification/InitStep';
import { GenericServer } from '../GenericServer';

export class FilesManager {
    private static instance: FilesManager;
    public static getInstance(): FilesManager {
        if (!this.instance) {
            this.instance = new FilesManager();
        }
        return this.instance;
    }
    private constructor() { }

    private files: { [uri: string]: InternalAventusFile } = {};
    public csharpFilesUri: string[] = [];

    private lockedUpdatedUri: { [uri: string]: NodeJS.Timeout } = {};
    private loadingInProgress: boolean = true;
    /**
     * Prevent double trigger from fileSystem and vscode
     */
    public preventUpdateUri(uri: string) {
        if (this.lockedUpdatedUri[uri]) {
            clearTimeout(this.lockedUpdatedUri[uri]);
        }
        this.lockedUpdatedUri[uri] = setTimeout(() => {
            delete this.lockedUpdatedUri[uri];
        }, 2000);
    }

    public async onCreatedUri(uri: string) {
        if (!this.files[uri]) {
            let extension = getLanguageIdByUri(uri);
            let currentPath = uriToPath(uri);
            let textDoc = TextDocument.create(uri, extension, 0, readFileSync(currentPath, 'utf8'));
            this.registerFile(textDoc);
        }
    }
    public async onUpdatedUri(uri: string) {
        if (this.lockedUpdatedUri[uri]) {
            return;
        }
        let extension = getLanguageIdByUri(uri);
        let currentPath = uriToPath(uri);

        let content: string = "";
        if (existsSync(currentPath)) {
            content = readFileSync(currentPath, 'utf8');
        }
        else {
            this.onDeletedUri(uri);
            return;
        }
        if (!this.files[uri]) {

            let textDoc = TextDocument.create(uri, extension, 0, content);
            this.registerFile(textDoc);
        }
        else {
            let newVersion = this.files[uri].versionUser + 1;
            let textDoc = TextDocument.create(uri, extension, newVersion, content);
            this.onContentChange(textDoc);
            this.onSave(textDoc);
        }
    }

    public async onDeletedUri(uri: string) {
        if (this.files[uri]) {
            GenericServer.sendDiagnostics({ uri: uri, diagnostics: [] })
            await this.files[uri].triggerDelete();
            delete this.files[uri];
        }
    }


    public async loadAllAventusFiles(workspaces: string[]): Promise<void> {
        this.loadingInProgress = true;
        let configFiles: TextDocument[] = [];
        InitStep.send("$(loading~spin) Aventus : Loading files")
        for (let i = 0; i < workspaces.length; i++) {
            let workspacePath = uriToPath(workspaces[i])
            /**
             * Loop between all workspaces to find all aventus files
             * @param workspacePath 
             */
            let readWorkspace = async (workspacePath) => {
                let folderContent = readdirSync(workspacePath);
                for (let i = 0; i < folderContent.length; i++) {
                    let currentPath = workspacePath + '/' + folderContent[i];
                    if (lstatSync(currentPath).isDirectory()) {
                        if (folderContent[i] != "node_modules") {
                            await readWorkspace(currentPath);
                        }
                    } else {
                        let uri = pathToUri(currentPath)
                        let extension = getLanguageIdByUri(uri);
                        if (folderContent[i] == AventusExtension.Config) {
                            configFiles.push(TextDocument.create(uri, extension, 0, readFileSync(currentPath, 'utf8')));
                        }
                        else if(folderContent[i] == AventusExtension.CsharpConfig) {
                            this.csharpFilesUri.push(uri);
                        }
                        else if (folderContent[i].endsWith(AventusExtension.Base)) {
                            let textDoc = TextDocument.create(uri, extension, 0, readFileSync(currentPath, 'utf8'));
                            await this.registerFile(textDoc);
                        }
                    }
                }
            }
            await readWorkspace(workspacePath);
        }
        InitStep.send("$(loading~spin) Aventus : Register config");
        this.loadingInProgress = false;
        for (let configFile of configFiles) {
            await this.registerFile(configFile);
        }
        InitStep.sendDone();
    }
    public async onShutdown() {
        for (let fileUri in this.files) {
            await this.files[fileUri].triggerDelete();
            delete this.files[fileUri];
        }
    }

    public async registerFile(document: TextDocument): Promise<void> {
        if (GenericServer.isDebug()) {
            console.log("registering " + document.uri);
        }
        if (!this.files[document.uri]) {
            await this.triggerOnNewFile(document);
        }
        else {
            await this.files[document.uri].triggerContentChange(document);
        }
    }
    public async onContentChange(document: TextDocument) {
        if (!this.files[document.uri]) {
            await this.triggerOnNewFile(document);
        }
        else {
            await this.files[document.uri].triggerContentChange(document);
        }
    }
    public async onSave(document: TextDocument) {
        if (!this.files[document.uri]) {
            await this.triggerOnNewFile(document);
        }
        else {
            await this.files[document.uri].triggerSave();
        }
    }
    public async onClose(document: TextDocument) {
        if (!existsSync(uriToPath(document.uri))) {
            if (this.files[document.uri]) {
                GenericServer.sendDiagnostics({ uri: document.uri, diagnostics: [] })
                await this.files[document.uri].triggerDelete();
                delete this.files[document.uri];
            }
        }
    }

    public async onCompletion(document: TextDocument, position: Position): Promise<CompletionList> {
        if (!this.files[document.uri]) {
            return { isIncomplete: false, items: [] }
        }
        return this.files[document.uri].getCompletion(position);
    }
    public async onCompletionResolve(document: TextDocument, item: CompletionItem): Promise<CompletionItem> {
        if (!this.files[document.uri]) {
            return item;
        }
        return this.files[document.uri].getCompletionResolve(item);
    }

    public async onHover(document: TextDocument, position: Position): Promise<Hover | null> {
        if (!this.files[document.uri]) {
            return null;
        }
        return this.files[document.uri].getHover(position);
    }

    public async onDefinition(document: TextDocument, position: Position): Promise<Definition | null> {
        if (!this.files[document.uri]) {
            return null;
        }
        return this.files[document.uri].getDefinition(position);
    }
    public async onFormatting(document: TextDocument, options: FormattingOptions): Promise<TextEdit[]> {
        if (!this.files[document.uri]) {
            return [];
        }
        return this.files[document.uri].getFormatting(options);
    }
    public async onCodeAction(document: TextDocument, range: Range): Promise<CodeAction[]> {
        if (!this.files[document.uri]) {
            return [];
        }
        return this.files[document.uri].getCodeAction(range);
    }
    public async onReferences(document: TextDocument, position: Position): Promise<Location[] | null> {
        if (!this.files[document.uri]) {
            return [];
        }
        return this.files[document.uri].getReferences(position);
    }
    public async onCodeLens(document: TextDocument): Promise<CodeLens[]> {
        if (!this.files[document.uri]) {
            return [];
        }
        return this.files[document.uri].getCodeLens();
    }

    public async onRename(document: TextDocument, position: Position, newName: string): Promise<WorkspaceEdit | null> {
        if (!this.files[document.uri]) {
            return null
        }
        return this.files[document.uri].getRename(position, newName)
    }

    public getBuild(document: TextDocument): Build[] {
        if (!this.files[document.uri]) {
            return [];
        }
        return this.files[document.uri].getBuild();
    }


    //#region event new file
    private onNewFileCb: { [uuid: string]: (document: AventusFile) => Promise<void> } = {};
    public async triggerOnNewFile(document: TextDocument): Promise<void> {
        if (GenericServer.isDebug()) {
            console.log("triggerOnNewFile " + document.uri);
        }
        if (this.loadingInProgress && document.uri.endsWith(AventusExtension.Config)) {
            return;
        }
        this.files[document.uri] = new InternalAventusFile(document);
        let proms: Promise<void>[] = [];
        for (let uuid in this.onNewFileCb) {
            proms.push(this.onNewFileCb[uuid](this.files[document.uri]));
        }
        await Promise.all(proms);
    }
    public onNewFile(cb: (document: AventusFile) => Promise<void>): string {
        let uuid = randomUUID();
        while (this.onNewFileCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onNewFileCb[uuid] = cb;
        return uuid;
    }
    public removeOnNewFile(uuid: string) {
        delete this.onNewFileCb[uuid];
    }
    //#endregion

    public getFilesMatching(regex: RegExp): AventusFile[] {
        let result: AventusFile[] = [];
        for (let uri in this.files) {
            let path = this.files[uri].path;
            if (path.match(regex)) {
                result.push(this.files[uri]);
            }
        }
        return result;
    }
    public getFilesWithExtension(extensions: string | string[]): AventusFile[] {
        if (!Array.isArray(extensions)) {
            extensions = [extensions];
        }
        let result: AventusFile[] = [];
        for (let uri in this.files) {
            for (let extension of extensions) {
                if (this.files[uri].path.endsWith(extension)) {
                    result.push(this.files[uri]);
                }
            }
        }
        return result;
    }
    public getByPath(path: string): AventusFile | undefined {
        return this.files[pathToUri(path)];
    }
    public getByUri(uri: string): AventusFile | undefined {
        return this.files[uri];
    }

}