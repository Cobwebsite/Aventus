import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { FilesManager }, { FilesWatcher }, { GenericServer }, { SettingsManager }, { pathToUri }] = await loadServerModules([
    'cmds/index.ts', 'files/FilesManager.ts', 'files/FilesWatcher.ts', 'GenericServer.ts', 'settings/Settings.ts', 'tools.ts',
]);

function setupManager(events) {
    const manager = new FilesManager();
    manager.loadingInProgress = false;
    FilesManager.instance = manager;
    FilesWatcher.instance = { unwatch: uri => events.push(['unwatch', uri]) };
    GenericServer.instance = {
        isIDE: true, logLevel: 99,
        connection: { sendDiagnostics: params => events.push(['diagnostics', params.uri, params.diagnostics]) },
    };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    return manager;
}

test('deleting a folder URI removes every registered file below it', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-folder-delete-'));
    const folder = join(root, 'BillGenerator');
    mkdirSync(folder);
    const paths = [join(folder, 'first.wcl.avt'), join(folder, 'second.wcl.avt')];
    paths.forEach(path => writeFileSync(path, 'content'));
    const uris = paths.map(pathToUri);
    const previous = [FilesManager.instance, FilesWatcher.instance, GenericServer.instance, SettingsManager.instance];
    const events = [];
    const manager = setupManager(events);
    try {
        for (const uri of uris) await manager.applyBatch({ created: [uri], updated: [], deleted: [] });
        rmSync(folder, { recursive: true });
        await Commands.allCommandes['aventus.filesystem.batch'].run({ created: [], updated: [], deleted: [pathToUri(folder)] });
        assert.deepEqual(manager.getUris(), []);
        assert.deepEqual(events.filter(event => event[0] === 'unwatch').map(event => event[1]).sort(), [...uris].sort());
        for (const uri of uris) {
            assert.ok(events.some(event => event[0] === 'diagnostics' && event[1] === uri && event[2].length === 0));
        }
    } finally {
        clearTimeout(manager.pendingTimeout);
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        [FilesManager.instance, FilesWatcher.instance, GenericServer.instance, SettingsManager.instance] = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
