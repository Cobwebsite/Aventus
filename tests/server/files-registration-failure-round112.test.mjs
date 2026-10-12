import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { GenericServer }, { FilesWatcher }] = await loadServerModules([
    'files/FilesManager.ts', 'GenericServer.ts', 'files/FilesWatcher.ts',
]);

test('failed new-file listener leaves registration cached and retry only updates its content', async () => {
    const manager = Object.create(FilesManager.prototype);
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    const oldServer = GenericServer.instance;
    const oldWatcher = FilesWatcher.instance;
    const events = [];
    const uri = 'file:///round112-listener.wcl.avt';
    GenericServer.instance = { isIDE: false, logLevel: 99 };
    FilesWatcher.instance = { watch: value => events.push(['watch', value]) };
    let fail = true;
    manager.onNewFile(async () => {
        events.push(['new', uri]);
        if (fail) throw new Error('listener failed');
    });
    try {
        await assert.rejects(manager.registerFile(TextDocument.create(uri, 'typescript', 1, 'first')), /listener failed/);
        const file = manager.getByUri(uri);
        assert.ok(file);
        assert.equal(file.contentUser, 'first');
        assert.deepEqual(events, [['new', uri]]);

        fail = false;
        await manager.registerFile(TextDocument.create(uri, 'typescript', 2, 'second'));
        assert.equal(manager.getByUri(uri), file);
        assert.equal(file.contentUser, 'second');
        assert.deepEqual(events, [['new', uri], ['watch', uri]]);
    } finally {
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = oldServer;
        FilesWatcher.instance = oldWatcher;
    }
});
