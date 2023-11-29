import { FSWatcher, watch } from 'chokidar';
import { existsSync, readFileSync } from 'fs';
import { v4 as randomUUID } from 'uuid';
import { Definition, FormattingOptions, Hover, Position, Range, TextEdit } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { pathToUri, uriToPath } from '../tools';
import { AventusFile, InternalAventusFile } from './AventusFile';
import { FilesManager } from './FilesManager';


export class FilesWatcher {
    private static instance: FilesWatcher | undefined;
    public static getInstance(): FilesWatcher {
        if (!this.instance) {
            this.instance = new FilesWatcher();
        }
        return this.instance;
    }
    private watcher: FSWatcher;
    private constructor() {
        this.watcher = watch('\t', {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true
        });
        this.watcher
            .on('add', this.onContentChange.bind(this))
            .on('change', this.onContentChange.bind(this))
            .on('unlink', this.onRemove.bind(this));

        FilesManager.getInstance().onNewFile(this.onNewFileFromManager.bind(this));
    }

    private files: { [uri: string]: InternalAventusFile } = {};
    private filesFromManager: { [uri: string]: InternalAventusFile } = {};
    private filesUriRegister: string[] = [];

    public async onNewFileFromManager(document: AventusFile) {
        if (this.files[document.uri]) {
            this.filesFromManager[document.uri] = (document as InternalAventusFile);
            this.addEvents(document);
        }
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
    }
    private addEvents(file: AventusFile): void {
        let document = file;
        //this.uuidEvents.onContentChange = document.onContentChange(this.onContentChange.bind(this));
        //this.uuidEvents.onValidate = document.onValidate(this.onValidate.bind(this));
        //this.uuidEvents.onSave = document.onSave(this.onSave.bind(this));
        this.uuidEvents.onDelete = document.onDelete(this.onDeleteFromManager.bind(this));
        //this.uuidEvents.onCompletion = document.onCompletion(this.onCompletion.bind(this));
        //this.uuidEvents.onCompletionResolve = document.onCompletionResolve(this.onCompletionResolve.bind(this));
        this.uuidEvents.onHover = document.onHover(this.onHover.bind(this));
        this.uuidEvents.onDefinition = document.onDefinition(this.onDefinition.bind(this));
        this.uuidEvents.onFormatting = document.onFormatting(this.onFormatting.bind(this));
        //this.uuidEvents.onCodeAction = document.onCodeAction(this.onCodeAction.bind(this));
    }
    private removeEvents(file: AventusFile): void {
        let document = file;
        //document.removeOnContentChange(this.uuidEvents.onContentChange);
        //document.removeOnValidate(this.uuidEvents.onValidate);
        //document.removeOnSave(this.uuidEvents.onSave);
        document.removeOnDelete(this.uuidEvents.onDelete);
        //document.removeOnCompletion(this.uuidEvents.onCompletion);
        //document.removeOnCompletionResolve(this.uuidEvents.onCompletionResolve);
        document.removeOnHover(this.uuidEvents.onHover);
        document.removeOnDefinition(this.uuidEvents.onDefinition);
        document.removeOnFormatting(this.uuidEvents.onFormatting);
        //document.removeOnCodeAction(this.uuidEvents.onCodeAction);
    }
    private async onDeleteFromManager(file: AventusFile): Promise<void> {
        if (this.filesFromManager[file.uri]) {
            this.removeEvents(this.filesFromManager[file.uri]);
            delete this.filesFromManager[file.uri];
        }
    }

    public registerFile(uri: string, languageId: string): AventusFile {
        if (!this.filesUriRegister.includes(uri)) {
            this.filesUriRegister.push(uri);
        }
        if (!this.files[uri]) {
            let pathToImport = uriToPath(uri);
            let txtToImport = "";
            if (existsSync(pathToImport)) {
                txtToImport = readFileSync(pathToImport, 'utf8')
            }
            let document = TextDocument.create(uri, languageId, 0, txtToImport);
            this.files[document.uri] = new InternalAventusFile(document);
            this.watcher.add(pathToImport);
            let realFile = FilesManager.getInstance().getByUri(uri);
            if (realFile) {
                this.addEvents(realFile);
                this.filesFromManager[uri] = realFile as InternalAventusFile;
            }
            for (let uuid in this.onNewFileCb) {
                this.onNewFileCb[uuid](this.files[document.uri]);
            }
        }

        return this.files[uri];
    }
    public onContentChange(path: string) {
        let uri = pathToUri(path);
        if (this.files[uri]) {
            let txtToImport = "";
            if (existsSync(path)) {
                txtToImport = readFileSync(path, 'utf8')
            }
            let document = TextDocument.create(
                uri,
                this.files[uri].document.languageId,
                this.files[uri].document.version + 1,
                txtToImport
            );
            this.files[uri].triggerContentChange(document);
        }
    }
    public async onRemove(path: string) {
        let uri = pathToUri(path);
        if (this.files[uri] && !this.filesUriRegister[uri]) {
            await this.files[uri].triggerDelete();
            delete this.files[uri];
        }
    }
    public async destroy() {
        await this.watcher.close();
        FilesWatcher.instance = undefined;
    }
    //#region event new file
    private onNewFileCb: { [uuid: string]: (document: AventusFile) => void } = {};
    public onNewFile(cb: (document: AventusFile) => void): string {
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

    public async onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
        if (this.files[document.uri]) {
            return await this.files[document.uri].getFormatting(options);
        }
        return [];
    }
    protected async onHover(document: AventusFile, position: Position): Promise<Hover | null> {
        if (this.files[document.uri]) {
            return await this.files[document.uri].getHover(position);
        }
        return null;
    }
    protected async onDefinition(document: AventusFile, position: Position): Promise<Definition | null> {
        if (this.files[document.uri]) {
            return await this.files[document.uri].getDefinition(position);
        }
        return null;
    }
}