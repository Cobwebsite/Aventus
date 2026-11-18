import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { GenericServer }, { FilesWatcher }, { SettingsManager }, { pathToUri }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'files/FilesWatcher.ts', 'settings/Settings.ts', 'tools.ts',
]);

test('client batches carry a disk file through the manager lifecycle', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-client-file-'));
    const path = join(root, 'component.wcl.avt');
    const uri = pathToUri(path);
    const old = [FilesManager.instance, GenericServer.instance, FilesWatcher.instance, SettingsManager.instance];
    const manager = new FilesManager();
    manager.pendingRegistrations = new Map();
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    const events = [];
    FilesManager.instance = manager;
    GenericServer.instance = { isIDE: true, logLevel: 99, connection: { sendDiagnostics: payload => events.push(['diagnostics', payload]) } };
    FilesWatcher.instance = { unwatch: value => events.push(['unwatch', value]) };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    manager.onNewFile(async file => {
        events.push(['new', file.contentUser]);
        file.onContentChange(async changed => events.push(['change', changed.contentUser]));
        file.onSave(async saved => events.push(['save', saved.contentUser]));
        file.onDelete(async deleted => events.push(['delete', deleted.uri]));
    });
    try {
        writeFileSync(path, 'first');
        await Commands.allCommandes['aventus.filesystem.batch'].run({ created: [uri], updated: [], deleted: [] });
        const file = manager.getByUri(uri);
        assert.ok(file);
        assert.equal(file.versionUser, 0);

        writeFileSync(path, 'second');
        await Commands.allCommandes['aventus.filesystem.batch'].run({ created: [], updated: [uri], deleted: [] });
        assert.equal(manager.getByUri(uri), file);
        assert.equal(file.versionUser, 1);

        await Commands.allCommandes['aventus.filesystem.batch'].run({ created: [], updated: [], deleted: [uri] });
        assert.equal(manager.getByUri(uri), undefined);
        assert.deepEqual(events.filter(event => event[0] !== 'diagnostics'), [
            ['new', 'first'], ['save', 'first'], ['change', 'second'], ['save', 'second'],
            ['delete', uri], ['unwatch', uri],
        ]);
        assert.deepEqual(events.filter(event => event[0] === 'diagnostics').at(-1),
            ['diagnostics', { uri, diagnostics: [] }]);
    } finally {
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        [FilesManager.instance, GenericServer.instance, FilesWatcher.instance, SettingsManager.instance] = old;
        rmSync(root, { recursive: true, force: true });
    }
});
