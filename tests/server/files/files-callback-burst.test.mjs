import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ FilesManager }, { FilesWatcher }, { GenericServer }, { SettingsManager }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'files/FilesWatcher.ts', 'GenericServer.ts', 'settings/Settings.ts', 'tools.ts',
]);

function freshManager() {
    const manager = Object.create(FilesManager.prototype);
    manager.pendingRegistrations = new Map();
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    return manager;
}

test('disk update burst retains latest cache and removed file subscribers stay silent through save and delete', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-file-burst-'));
    const path = join(root, 'burst.wcl.avt');
    const uri = pathToUri(path);
    const previous = [FilesManager.instance, FilesWatcher.instance, GenericServer.instance, SettingsManager.instance];
    const manager = freshManager();
    const events = [];
    FilesManager.instance = manager;
    FilesWatcher.instance = { watch() {}, unwatch: value => events.push(['unwatch', value]) };
    GenericServer.instance = { isIDE: false, logLevel: 99, connection: { sendDiagnostics() {} } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let entered;
    const firstEntered = new Promise(resolve => { entered = resolve; });
    try {
        writeFileSync(path, 'initial');
        await manager.registerFile(TextDocument.create(uri, 'typescript', 1, 'initial'));
        const file = manager.getByUri(uri);
        const removedChange = file.onContentChange(async () => events.push(['removed-change']));
        const removedSave = file.onSave(async () => events.push(['removed-save']));
        const removedDelete = file.onDelete(async () => events.push(['removed-delete']));
        file.onContentChange(async current => {
            events.push(['change', current.versionUser, current.contentUser]);
            if (current.versionUser === 2) {
                entered();
                await gate;
            }
        });
        file.onSave(async current => events.push(['save', current.versionUser, current.contentUser]));
        file.onDelete(async current => events.push(['delete', current.uri]));

        file.removeOnContentChange(removedChange);
        file.removeOnSave(removedSave);
        file.removeOnDelete(removedDelete);
        writeFileSync(path, 'disk two');
        const first = manager.onUpdatedUri(uri);
        await firstEntered;
        writeFileSync(path, 'disk three');
        const second = manager.onUpdatedUri(uri);
        release();
        await Promise.all([first, second]);

        assert.equal(manager.getByUri(uri), file);
        assert.equal(file.versionUser, 3);
        assert.equal(file.contentUser, 'disk three');
        assert.deepEqual(events, [
            ['change', 2, 'disk two'], ['save', 2, 'disk two'],
            ['change', 3, 'disk three'], ['save', 3, 'disk three'],
        ]);

        unlinkSync(path);
        await manager.onDeletedUri(uri);
        assert.equal(manager.getByUri(uri), undefined);
        assert.deepEqual(events.slice(-2), [['delete', uri], ['unwatch', uri]]);
        assert.equal(events.some(event => event[0].startsWith('removed')), false);
    } finally {
        release();
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        [FilesManager.instance, FilesWatcher.instance, GenericServer.instance, SettingsManager.instance] = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
