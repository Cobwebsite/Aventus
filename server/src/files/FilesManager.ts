import { existsSync, lstatSync, readdirSync, readFileSync } from 'fs';
import { Hover } from 'vscode-languageclient';
import { CodeAction, CodeLens, CompletionItem, CompletionList, Definition, FormattingOptions, Location, Position, Range, TextEdit, WorkspaceEdit } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusExtension, AventusLanguageId } from '../definition';
import { escapeRegex, getLanguageIdByUri, pathToUri, Timer, uriToPath } from '../tools';
import { AventusFile, InternalAventusFile } from './AventusFile';
import { v4 as randomUUID } from 'uuid';
import { Build } from '../project/Build';
import { InitStep } from '../notification/InitStep';
import { GenericServer } from '../GenericServer';
import { FilesWatcher } from './FilesWatcher';
import { SettingsManager } from '../settings/Settings';
import { normalize } from 'path';
import { ProjectManager } from '../project/ProjectManager';
import { Statistics } from '../notification/Statistics';

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
            await this.onContentChange(textDoc);
            this.onSave(textDoc);
        }
    }

    public async onDeletedUri(uri: string) {
        if (this.files[uri]) {
            if (SettingsManager.getInstance().settings.errorByBuild) {
                const builds = this.files[uri].getBuild();
                for (let build of builds) {
                    GenericServer.sendDiagnostics({ uri: uri, diagnostics: [] }, build)
                }
            }
            else {
                GenericServer.sendDiagnostics({ uri: uri, diagnostics: [] })
            }
            await this.files[uri].triggerDelete();
            delete this.files[uri];
            FilesWatcher.getInstance().unwatch(uri);
        }
    }

    public async loadConfigFileNotSet(workspaces: string[], builds?: string[], statics?: string[]) {
        for (let i = 0; i < workspaces.length; i++) {
            let workspacePath = uriToPath(workspaces[i])
            let readWorkspace = async (workspacePath): Promise<boolean> => {
                let folderContent = readdirSync(workspacePath);
                for (let i = 0; i < folderContent.length; i++) {
                    let currentPath = workspacePath + '/' + folderContent[i];
                    if (lstatSync(currentPath).isDirectory()) {
                        if (folderContent[i] != "node_modules") {
                            if (await readWorkspace(currentPath)) {
                                return true;
                            }
                        }
                    } else {
                        let uri = pathToUri(currentPath)
                        if (folderContent[i] == AventusExtension.Config) {
                            await this.loadConfigFile(uri, builds, statics);
                            return true;
                        }
                    }
                }
                return false;
            }
            if (await readWorkspace(workspacePath)) {
                return;
            }
        }

        // if not found
        GenericServer.showErrorMessage("Can't find a aventus.config.avt inside the workspaces " + workspaces.join(", "));
    }
    public async loadConfigFile(configUri: string, builds?: string[], statics?: string[]) {
        ProjectManager.autoLoad = false;
        let configPath = uriToPath(configUri);
        configUri = pathToUri(configPath);
        const configFile = TextDocument.create(pathToUri(configPath), AventusExtension.Config, 0, readFileSync(configPath, 'utf8'))
        this.loadingInProgress = false;
        await this.registerFile(configFile);
        this.loadingInProgress = true;

        const project = ProjectManager.getInstance().getProjectByUri(configUri);
        if (project) {
            await project.loadConfig();
            project.buildsAllowed = builds;
            project.staticsAllowed = statics;
            const config = project.getConfig();
            if (config) {
                let readDir = async (workspacePath) => {
                    if (!existsSync(workspacePath)) return;
                    let folderContent = readdirSync(workspacePath);
                    for (let i = 0; i < folderContent.length; i++) {
                        let currentPath = workspacePath + '/' + folderContent[i];
                        if (lstatSync(currentPath).isDirectory()) {
                            if (folderContent[i] != "node_modules") {
                                await readDir(currentPath);
                            }
                        } else {
                            let uri = pathToUri(currentPath)
                            let extension = getLanguageIdByUri(uri);
                            if (folderContent[i] == AventusExtension.Config) { }
                            else if (folderContent[i].endsWith(AventusExtension.Base)) {
                                let textDoc = TextDocument.create(uri, extension, 0, readFileSync(currentPath, 'utf8'));
                                await this.registerFile(textDoc);
                            }
                        }
                    }
                }
                for (let build of config.build) {
                    if (!builds || builds.includes(build.name)) {
                        for (let src of build.srcPath) {
                            await readDir(src);
                        }
                    }
                }
                
                Statistics.startSendLoadFile();
                project.loadFiles();
                Statistics.sendLoadFile();
                this.loadingInProgress = false;

                await project.init();
                InitStep.sendDone();
            }
        }
    }
    public async loadAllAventusFiles(workspaces: string[]): Promise<void> {
        this.loadingInProgress = true;
        let configFiles: TextDocument[] = [];
        let readDirs = SettingsManager.getInstance().settings.readDirs;
        InitStep.send("$(loading~spin) Aventus : Loading files")

        for (let i = 0; i < workspaces.length; i++) {
            let workspacePath = uriToPath(workspaces[i])

            let checkPath = (workspacePathTemp: string) => {
                return true;
            }
            if (readDirs.length > 0) {
                let regexsDir: string[] = [];
                const allowedDirs: string[] = [];
                for (let dir of readDirs) {
                    let slash = "";
                    let allowPath = dir.replace(/\\/g, '/');
                    if (!allowPath.startsWith("/")) {
                        slash = "/";
                    }
                    let splitedpath = allowPath.split("/");
                    if (splitedpath[splitedpath.length - 1] == "" || splitedpath[splitedpath.length - 1] == "*") {
                        splitedpath[splitedpath.length - 1] = "*"
                    }
                    else if (splitedpath[splitedpath.length - 1].indexOf(".") == -1) {
                        // its a folder but without end slash
                        splitedpath.push("*");
                    }
                    allowPath = splitedpath.join("/");
                    let regTemp = normalize(uriToPath(workspaces[i]) + slash + allowPath).replace(/\\/g, '/');
                    regTemp = escapeRegex(regTemp, true).replace("*", ".*");
                    let splittedAllow = regTemp.split("/");
                    let currentPath = "";
                    for (let part of splittedAllow) {
                        if (part == ".*") continue;
                        if (currentPath == "") currentPath = part;
                        else currentPath += "/" + part;

                        if (!allowedDirs.includes(currentPath)) {
                            allowedDirs.push(currentPath);
                        }
                    }
                    regexsDir.push("(^" + regTemp + "$)");

                }
                let regexsDirJoin = regexsDir.join("|");
                if (regexsDirJoin == "") {
                    regexsDirJoin = "(?!)";
                }
                const regex = new RegExp(regexsDirJoin);
                checkPath = (workspacePathTemp: string) => {
                    // for the children
                    const resChildren = (workspacePathTemp + "/").match(regex) != null;
                    // for the parent
                    const resParent = allowedDirs.includes(workspacePathTemp);
                    return resChildren || resParent;
                }
            }

            /**
             * Loop between all workspaces to find all aventus files
             * @param workspacePath 
             */
            let readWorkspace = async (workspacePath) => {
                if (!checkPath(workspacePath)) return;

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
            FilesWatcher.getInstance().unwatch(fileUri);
        }
    }

    /**
     * Register a file from outside of the project - used only for package
     * @param uri 
     * @returns 
     */
    public async registerFilePackage(uri: string): Promise<AventusFile> {
        let pathToImport = uriToPath(uri);
        let txtToImport = "";
        if (existsSync(pathToImport)) {
            txtToImport = readFileSync(pathToImport, 'utf8')
        }
        let document = TextDocument.create(uri, AventusLanguageId.Package, 0, txtToImport);
        FilesWatcher.getInstance().watch(uri);
        return await this.registerFile(document);
    }
    public async registerFile(document: TextDocument): Promise<AventusFile> {
        if (GenericServer.isDebug()) {
            console.log("registering " + document.uri);
        }
        if (!this.files[document.uri]) {
            await this.triggerOnNewFile(document);
        }
        else {
            await this.files[document.uri].triggerContentChange(document);
        }
        return this.files[document.uri];
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
            this.onDeletedUri(document.uri);
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

    private onFileRemoveCb: { [uuid: string]: (uri: string) => Promise<void> } = {};
    public async triggerOnFileRemove(uri: string): Promise<void> {
        if (GenericServer.isDebug()) {
            console.log("triggerOnFileRemove " + uri);
        }
        let proms: Promise<void>[] = [];
        for (let uuid in this.onFileRemoveCb) {
            proms.push(this.onFileRemoveCb[uuid](uri));
        }
        await Promise.all(proms);
    }
    public onFileRemove(cb: (uri: string) => Promise<void>): string {
        let uuid = randomUUID();
        while (this.onNewFileCb[uuid] != undefined) {
            uuid = randomUUID();
        }
        this.onFileRemoveCb[uuid] = cb;
        return uuid;
    }
    public removeOnFileRemove(uuid: string) {
        delete this.onFileRemoveCb[uuid];
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