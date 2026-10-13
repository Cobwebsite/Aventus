import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { watch } from 'chokidar';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const [{ FilesManager }, { FilesWatcher }, { GenericServer }, { SettingsManager }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'files/FilesWatcher.ts', 'GenericServer.ts', 'settings/Settings.ts', 'tools.ts',
]);

test('renaming a disk file removes its watched URI without discovering the new path', { timeout: 15_000 }, async () => {
    const dir = mkdtempSync(join(root, 'aventus-watcher-rename-'));
    const oldPath = join(dir, 'before.wcl.avt');
    const newPath = join(dir, 'after.wcl.avt');
    const oldUri = pathToUri(oldPath);
    const newUri = pathToUri(newPath);
    const previous = [FilesManager.instance, FilesWatcher.instance, GenericServer.instance, SettingsManager.instance];
    const manager = Object.create(FilesManager.prototype);
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    const watcher = Object.create(FilesWatcher.prototype);
    watcher.watcheUris = [];
    watcher.pendingEvents = new Map();
    const events = [];
    let diskWatcher;
    FilesManager.instance = manager;
    FilesWatcher.instance = watcher;
    GenericServer.instance = { isIDE: false, logLevel: 99, connection: { sendDiagnostics() {} } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    try {
        writeFileSync(oldPath, 'class Before {}');
        manager.onNewFile(async file => {
            events.push(['new', file.uri]);
            file.onDelete(async () => events.push(['delete', file.uri]));
        });
        // A real filesystem watcher observes the same individual path that FilesWatcher.watch() subscribes to.
        diskWatcher = watch([], { ignoreInitial: true, persistent: true });
        watcher.watcher = diskWatcher;
        diskWatcher.on('unlink', path => void watcher.onRemove(path));
        await manager.registerFile(TextDocument.create(oldUri, 'typescript', 1, 'class Before {}'));
        assert.deepEqual(watcher.watcheUris, [oldUri]);
        await new Promise(resolve => diskWatcher.once('ready', resolve));
        renameSync(oldPath, newPath);
        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(Error('Watcher did not report removal')), 8_000);
            const check = setInterval(() => {
                if (manager.getByUri(oldUri) !== undefined) return;
                clearInterval(check);
                clearTimeout(timer);
                resolve();
            }, 20);
        });
        assert.equal(manager.getByUri(newUri), undefined);
        assert.deepEqual(events, [['new', oldUri], ['delete', oldUri]]);
    } finally {
        for (const timeout of Object.values(manager.lockedUpdatedUri)) clearTimeout(timeout);
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        await diskWatcher?.close();
        [FilesManager.instance, FilesWatcher.instance, GenericServer.instance, SettingsManager.instance] = previous;
        rmSync(dir, { recursive: true, force: true });
    }
});
