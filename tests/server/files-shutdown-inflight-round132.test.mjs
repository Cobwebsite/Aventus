import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { FilesWatcher }, { GenericServer }] = await loadServerModules([
    'files/FilesManager.ts', 'files/FilesWatcher.ts', 'GenericServer.ts',
]);

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

test('shutdown waits for an already-started content-change callback before deleting the file', async () => {
    const previous = [FilesWatcher.instance, GenericServer.instance];
    const manager = Object.create(FilesManager.prototype);
    manager.pendingRegistrations = new Map();
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    const uri = 'file:///round132/inflight.wcl.avt';
    const doc = (version, content) => TextDocument.create(uri, 'typescript', version, content);
    const started = deferred();
    const release = deferred();
    const events = [];
    FilesWatcher.instance = { unwatch: value => events.push(['unwatch', value]) };
    GenericServer.instance = { isIDE: true, logLevel: 99 };
    manager.onNewFile(async file => {
        file.onContentChange(async () => {
            events.push(['change-start', file.versionUser]);
            started.resolve();
            await release.promise;
            events.push(['change-end', file.versionUser]);
        });
        file.onDelete(async () => events.push(['delete', file.versionUser]));
    });
    try {
        await manager.registerFile(doc(1, 'first'));
        const changing = manager.onContentChange(doc(2, 'second'));
        await started.promise;
        const shutdown = manager.onShutdown();
        await Promise.resolve();
        assert.equal(manager.getByUri(uri)?.isDeleted, true);
        assert.deepEqual(events, [['change-start', 2]]);
        release.resolve();
        await Promise.all([changing, shutdown]);
        assert.equal(manager.getByUri(uri), undefined);
        assert.deepEqual(events, [
            ['change-start', 2], ['change-end', 2], ['delete', 2], ['unwatch', uri],
        ]);
    } finally {
        release.resolve();
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        [FilesWatcher.instance, GenericServer.instance] = previous;
    }
});
