import { FSWatcher, watch } from 'chokidar';
import { pathToUri, uriToPath } from '../tools';
import { FilesManager } from './FilesManager';
import { SettingsManager } from '../settings/Settings';
import { GenericServer } from '../GenericServer';


export class FilesWatcher {
    private static instance: FilesWatcher | undefined;
    public static getInstance(): FilesWatcher {
        if (!this.instance) {
            this.instance = new FilesWatcher();
        }
        return this.instance;
    }
    private watcher?: FSWatcher;
    private pendingEvents: Map<string, Promise<void>> = new Map();
    private destroyed = false;
    private constructor() {
        if (SettingsManager.getInstance().settings.watchFiles) {
            this.watcher = watch('\t', {
                ignored: /(^|[\/\\])\../, // ignore dotfiles
                persistent: true
            });
            this.watcher
                .on('add', async path => void this.onContentChange(path).catch(GenericServer.error))
                .on('change', async path => void this.onContentChange(path).catch(GenericServer.error))
                .on('unlink', async path => void this.onRemove(path).catch(GenericServer.error))
        }
    }

    private watcheUris: string[] = [];
    private watchGeneration: Map<string, number> = new Map();
    private getWatchGenerationId(uri:string) {
        return this.watchGeneration.get(uri) ?? 0;
    }
    public watch(uri: string) {
        if (this.destroyed) return;
        if (this.watcheUris.includes(uri)) return
        if (!this.watcher) return;

        let pathToWatch = uriToPath(uri);
        this.watcher.add(pathToWatch);
        this.watcheUris.push(uri)
    }

    public unwatch(uri: string) {
        let index = this.watcheUris.indexOf(uri);
        if (index == -1) return

        this.watcheUris.splice(index, 1);
        this.watchGeneration.set(uri, this.getWatchGenerationId(uri) + 1);
        this.watcher?.unwatch(uriToPath(uri));
    }

    public async onContentChange(path: string) {
        GenericServer.debug("onContentChange : " + path)
        let uri = pathToUri(path);
        if (this.watcheUris.includes(uri)) {
            await this.enqueue(uri, () => FilesManager.getInstance().onUpdatedUri(uri));
        }
    }
    public async onRemove(path: string) {
        let uri = pathToUri(path);
        if (this.watcheUris.includes(uri)) {
            await this.enqueue(uri, () => FilesManager.getInstance().onDeletedUri(uri));
        }
    }
    private enqueue(uri: string, action: () => Promise<void>): Promise<void> {
        if (this.destroyed) return Promise.resolve();
        const pendingEvents = this.pendingEvents;
        const previous = pendingEvents.get(uri) ?? Promise.resolve();
        const generation = this.getWatchGenerationId(uri);
        const current = previous.catch(() => { }).then(() => {
            if (!this.destroyed && this.watcheUris.includes(uri) && this.getWatchGenerationId(uri) === generation) {
                return action();
            }
            return;
        });
        pendingEvents.set(uri, current);
        const cleanup = () => {
            if (pendingEvents.get(uri) === current) pendingEvents.delete(uri);
        };
        current.then(cleanup, cleanup);
        return current;
    }
    public async destroy() {
        this.destroyed = true;
        const pending = [...this.pendingEvents.values()];
        try {
            await this.watcher?.close();
        } finally {
            await Promise.allSettled(pending);
            FilesWatcher.instance = undefined;
        }
    }
}
