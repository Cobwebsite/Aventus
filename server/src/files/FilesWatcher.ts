import { FSWatcher, watch } from 'chokidar';
import { pathToUri, uriToPath } from '../tools';
import { FilesManager } from './FilesManager';
import { SettingsManager } from '../settings/Settings';


export class FilesWatcher {
    private static instance: FilesWatcher | undefined;
    public static getInstance(): FilesWatcher {
        if (!this.instance) {
            this.instance = new FilesWatcher();
        }
        return this.instance;
    }
    private watcher?: FSWatcher;
    private constructor() {
        if (!SettingsManager.getInstance().settings.onlyBuild) {
            this.watcher = watch('\t', {
                ignored: /(^|[\/\\])\../, // ignore dotfiles
                persistent: true
            });
            this.watcher
                .on('add', this.onContentChange.bind(this))
                .on('change', this.onContentChange.bind(this))
                .on('unlink', this.onRemove.bind(this));
        }
    }

    private watcheUris: string[] = [];
    public watch(uri: string) {
        if (this.watcheUris.includes(uri)) return
        if (!this.watcher) return;

        this.watcheUris.push(uri)
        let pathToWatch = uriToPath(uri);
        this.watcher.add(pathToWatch);
    }

    public unwatch(uri: string) {
        let index = this.watcheUris.indexOf(uri);
        if (index == -1) return

        this.watcheUris.splice(index, 1);
    }

    public async onContentChange(path: string) {
        let uri = pathToUri(path);
        if (this.watcheUris.includes(uri)) {
            FilesManager.getInstance().onUpdatedUri(uri);
        }
    }
    public async onRemove(path: string) {
        let uri = pathToUri(path);
        if (this.watcheUris.includes(uri)) {
            FilesManager.getInstance().onDeletedUri(uri);
        }
    }
    public async destroy() {
        await this.watcher?.close();
        FilesWatcher.instance = undefined;
    }
}