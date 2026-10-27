import { existsSync, lstatSync, readdirSync, readFileSync } from 'fs';
import { Hover } from 'vscode-languageclient';
import { CodeAction, CodeLens, CompletionItem, CompletionList, FormattingOptions, Location, Position, Range, TextEdit, WorkspaceEdit } from 'vscode-languageserver';
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
import { relative } from 'path';
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
    private pendingRegistrations = new Map<string, Promise<void>>();
    private pendingTemplateInitializations: Map<string, Promise<boolean>> = new Map();
    private failedTemplateInitializations: Set<string> = new Set();

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
            if (extension) {
                let currentPath = uriToPath(uri);
                let textDoc = TextDocument.create(uri, extension, 0, readFileSync(currentPath, 'utf8'));
                await this.registerFile(textDoc);
                await this.onSave(textDoc);
            }
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
            await this.onDeletedUri(uri);
            return;
        }
        if (!this.files[uri]) {
            let textDoc = TextDocument.create(uri, extension, 0, content);
            await this.registerFile(textDoc);
            await this.onSave(textDoc);
        }
        else {
            let newVersion = this.files[uri].versionUser + 1;
            let textDoc = TextDocument.create(uri, extension, newVersion, content);
            await this.onContentChange(textDoc);
            await this.onSave(textDoc);
        }
    }

    public async onDeletedUri(uri: string) {
        const file = this.files[uri];
        if (file) {
            if (SettingsManager.getInstance().settings.errorByBuild) {
                const builds = file.getBuild();
                if (builds === null) {
                    GenericServer.sendDiagnostics({ uri: uri, diagnostics: [] })
                }
                else {
                    for (let build of builds) {
                        GenericServer.sendDiagnostics({ uri: uri, diagnostics: [] }, build)
                    }
                }
            }
            else {
                GenericServer.sendDiagnostics({ uri: uri, diagnostics: [] })
            }
            delete this.files[uri];
            await file.triggerDelete();
            if (!this.files[uri]) {
                FilesWatcher.getInstance().unwatch(uri);
            }
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
        InitStep.sendDone();
        // GenericServer.showErrorMessage("Can't find a aventus.config.avt inside the workspaces " + workspaces.join(", "));
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
                    if (!builds || builds.includes(build.name ?? "")) {
                        for (let src of build.srcPath) {
                            await readDir(src);
                        }
                    }
                }
                for (let _static of config.static) {
                    if (!statics || statics.includes(_static.name ?? "")) {
                        await readDir(_static.inputPathFolder);
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

    private async parseWorkspace(workspace: string, onFile: (file: string, path: string) => Promise<void>): Promise<void> {
        let workspacePath = uriToPath(workspace)
        let readDirs = SettingsManager.getInstance().settings.readDirs;

        let checkPath = (workspacePathTemp: string) => {
            return true;
        }
        let checkFile = (filePath: string) => true;
        if (readDirs.length > 0) {
            const patterns = readDirs.map(dir => {
                const parts = dir.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '').split('/').filter((part, index) => part !== '.' || index !== 0);
                const segments = parts.map(part => new RegExp('^' + escapeRegex(part, true).replace(/\*/g, '[^/]*') + '$'));
                return { segments, isFile: parts[parts.length - 1].includes('.') };
            });
            const pathSegments = (path: string) => {
                return relative(workspacePath, path).replace(/\\/g, '/').split('/').filter(Boolean);
            }

            const matchesPrefix = (path: string[], pattern: RegExp[]) => {
                return path.every((segment, index) => pattern[index]?.test(segment) ?? false);
            }
            checkPath = (path: string) => {
                const segments = pathSegments(path);
                for (let pattern of patterns) {
                    if (segments.length <= pattern.segments.length) {
                        if (matchesPrefix(segments, pattern.segments)) {
                            return true;
                        }
                    }
                    else if (!pattern.isFile && matchesPrefix(segments.slice(0, pattern.segments.length), pattern.segments)) {
                        return true;
                    }
                }
                return false;
            };
            checkFile = (path: string) => {
                const segments = pathSegments(path);
                for (let pattern of patterns) {
                    if (pattern.isFile) {
                        if (segments.length === pattern.segments.length && matchesPrefix(segments, pattern.segments)) {
                            return true;
                        }
                    }
                    else if (segments.length > pattern.segments.length && matchesPrefix(segments.slice(0, pattern.segments.length), pattern.segments)) {
                        return true;
                    }
                }
                return false;
            };
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
                    if (folderContent[i] != "node_modules" && folderContent[i] != ".git") {
                        await readWorkspace(currentPath);
                    }
                } else {
                    if (checkFile(currentPath)) {
                        await onFile(folderContent[i], currentPath);
                    }
                }
            }
        }
        await readWorkspace(workspacePath);
    }
    public async loadAllAventusConfigFiles(workspaces: string[]): Promise<AventusFile[]> {
        let configFiles: AventusFile[] = [];
        const seenUris = new Set<string>();

        for (let i = 0; i < workspaces.length; i++) {
            await this.parseWorkspace(workspaces[i], async (file, currentPath) => {
                let uri = pathToUri(currentPath)
                let extension = getLanguageIdByUri(uri);
                if (file == AventusExtension.Config) {
                    if (seenUris.has(uri)) return;
                    seenUris.add(uri);
                    configFiles.push(new InternalAventusFile(TextDocument.create(uri, extension, 0, readFileSync(currentPath, 'utf8'))));
                }
            })
        }
        return configFiles;
    }
    public async loadAllAventusFiles(workspaces: string[]): Promise<void> {
        this.loadingInProgress = true;
        const configFiles: TextDocument[] = [];
        const seenUris = new Set<string>();
        const failures: string[] = [];
        const recordFailure = (uri: string, error: unknown) => {
            failures.push(uri + ': ' + (error instanceof Error ? error.message : String(error)));
        };

        try {
            InitStep.send("$(loading~spin) Aventus : Loading files");
            for (let i = 0; i < workspaces.length; i++) {
                try {
                    await this.parseWorkspace(workspaces[i], async (file, currentPath) => {
                        const uri = pathToUri(currentPath);
                        if (seenUris.has(uri)) return;
                        if (file != AventusExtension.Config && !file.endsWith(AventusExtension.Base)) return;
                        seenUris.add(uri);
                        try {
                            const extension = getLanguageIdByUri(uri);
                            const document = TextDocument.create(uri, extension, 0, readFileSync(currentPath, 'utf8'));
                            if (file == AventusExtension.Config) {
                                configFiles.push(document);
                            }
                            else {
                                await this.registerFile(document);
                            }
                        } catch (error) {
                            recordFailure(uri, error);
                        }
                    });
                } catch (error) {
                    recordFailure(workspaces[i], error);
                }
            }
            InitStep.send("$(loading~spin) Aventus : Register config");
            this.loadingInProgress = false;
            for (const configFile of configFiles) {
                try {
                    await this.registerFile(configFile);
                } catch (error) {
                    recordFailure(configFile.uri, error);
                }
            }
        } finally {
            this.loadingInProgress = false;
            InitStep.sendDone();
        }
        if (failures.length > 0) {
            GenericServer.showErrorMessage("Aventus could not load these files:\n" + failures.join("\n"));
        }
    }
    public async onShutdown() {
        for (let fileUri in this.files) {
            await this.files[fileUri].triggerDelete();
            delete this.files[fileUri];
            FilesWatcher.getInstance().unwatch(fileUri);
        }
    }

    protected async fileExists(document: TextDocument) {
        const uri = document.uri;
        if (uri.endsWith(AventusExtension.Template)) {
            const pending = this.pendingTemplateInitializations.get(uri);
            if (pending) return pending;

            if (!this.files[uri] || this.failedTemplateInitializations.has(uri)) {

                const initialization = (async () => {
                    if (!this.files[uri]) await this.registerFile(document);
                    if (!this.files[uri]) return false;
                    await this.onSave(document);
                    return true;
                })();

                const initializations = this.pendingTemplateInitializations;
                initializations.set(uri, initialization);

                try {
                    const exists = await initialization;
                    this.failedTemplateInitializations.delete(uri);
                    return exists;
                } catch (error) {
                    this.failedTemplateInitializations.add(uri);
                    throw error;
                } finally {
                    initializations.delete(uri);
                }
            }
        }
        return !!this.files[uri];
    }

    /**
     * Register a file from outside of the project - used only for package
     * @param uri 
     * @returns 
     */
    public async registerFilePackage(uri: string): Promise<AventusFile | undefined> {
        let pathToImport = uriToPath(uri);
        let txtToImport = "";
        if (existsSync(pathToImport)) {
            txtToImport = readFileSync(pathToImport, 'utf8')
        }
        let document = TextDocument.create(uri, AventusLanguageId.Package, 0, txtToImport);
        FilesWatcher.getInstance().watch(uri);
        return await this.registerFile(document);
    }
    public async registerFile(document: TextDocument): Promise<AventusFile | undefined> {
        GenericServer.debug("registering " + document.uri);
        const pendingRegistrations = this.pendingRegistrations;
        const previous = pendingRegistrations.get(document.uri);
        let release!: () => void;
        const current = new Promise<void>(resolve => { release = resolve; });
        pendingRegistrations.set(document.uri, current);
        try {
            if (previous) await previous;
            if (!this.files[document.uri]) {
                await this.triggerOnNewFile(document);
            }
            else {
                await this.files[document.uri].triggerContentChange(document);
            }
            if (!this.files[document.uri]) return undefined;
            if (!GenericServer.isIDE) {
                FilesWatcher.getInstance().watch(document.uri);
            }
            return this.files[document.uri];
        } finally {
            if (pendingRegistrations.get(document.uri) === current) {
                pendingRegistrations.delete(document.uri);
            }
            release();
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
        await this.files[document.uri]?.triggerSave();
    }
    public async onClose(document: TextDocument) {
        if (!existsSync(uriToPath(document.uri))) {
            await this.onDeletedUri(document.uri);
        }
    }

    public async onCompletion(document: TextDocument, position: Position): Promise<CompletionList> {
        if (!await this.fileExists(document)) {
            return { isIncomplete: false, items: [] }
        }
        return this.files[document.uri].getCompletion(position);
    }
    public async onCompletionResolve(document: TextDocument, item: CompletionItem): Promise<CompletionItem> {
        if (!await this.fileExists(document)) {
            return item;
        }
        return this.files[document.uri].getCompletionResolve(item);
    }

    public async onHover(document: TextDocument, position: Position): Promise<Hover | null> {
        if (!await this.fileExists(document)) {
            return null;
        }
        return this.files[document.uri].getHover(position);
    }

    public async onDefinition(document: TextDocument, position: Position): Promise<Location[] | null> {
        if (!await this.fileExists(document)) {
            return null;
        }
        return this.files[document.uri].getDefinition(position);
    }
    public async onFormatting(document: TextDocument, options: FormattingOptions): Promise<TextEdit[]> {
        if (!await this.fileExists(document)) {
            return [];
        }
        return this.files[document.uri].getFormatting(options);
    }
    public async onCodeAction(document: TextDocument, range: Range): Promise<CodeAction[]> {
        if (!await this.fileExists(document)) {
            return [];
        }
        return this.files[document.uri].getCodeAction(range);
    }
    public async onReferences(document: TextDocument, position: Position): Promise<Location[] | null> {
        if (!await this.fileExists(document)) {
            return [];
        }
        return this.files[document.uri].getReferences(position);
    }
    public async onCodeLens(document: TextDocument): Promise<CodeLens[]> {
        if (!await this.fileExists(document)) {
            return [];
        }
        return this.files[document.uri].getCodeLens();
    }

    public async onRename(document: TextDocument, position: Position, newName: string): Promise<WorkspaceEdit | null> {
        if (!await this.fileExists(document)) {
            return null
        }
        return this.files[document.uri].getRename(position, newName)
    }

    public getBuild(document: TextDocument): Build[] | null {
        if (!this.files[document.uri]) {
            return [];
        }
        return this.files[document.uri].getBuild();
    }


    //#region event new file
    private onNewFileCb: { [uuid: string]: (document: AventusFile) => Promise<void> } = {};
    public async triggerOnNewFile(document: TextDocument): Promise<void> {
        GenericServer.debug("triggerOnNewFile " + document.uri);
        if (this.loadingInProgress && document.uri.endsWith(AventusExtension.Config)) {
            return;
        }
        const file = new InternalAventusFile(document);
        this.files[document.uri] = file;
        let proms: Promise<void>[] = [];
        for (let uuid in this.onNewFileCb) {
            proms.push(Promise.resolve().then(() => this.onNewFileCb[uuid](file)));
        }
        const results = await Promise.allSettled(proms);
        const failure = results.find(result => result.status === 'rejected');
        if (failure) {
            try {
                await file.triggerDelete();
            } finally {
                if (this.files[document.uri] === file) {
                    delete this.files[document.uri];
                }
            }
            GenericServer.error("Can't register file " + document.uri + " : " + failure.reason);
        }
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
        GenericServer.debug("triggerOnFileRemove " + uri);
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
    public getUris(): string[] {
        return Object.keys(this.files);
    }
}
