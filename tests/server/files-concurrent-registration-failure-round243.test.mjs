import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { FilesWatcher }, { GenericServer }] = await loadServerModules([
    'files/FilesManager.ts', 'files/FilesWatcher.ts', 'GenericServer.ts',
]);

test('a failed first registration discards a newer update made while its listener is pending', async t => {
    const manager = Object.create(FilesManager.prototype);
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    const previousServer = GenericServer.instance;
    const previousWatcher = FilesWatcher.instance;
    const uri = 'file:///round243/concurrent.wcl.avt';
    const document = (version, content) => TextDocument.create(uri, 'typescript', version, content);
    const events = [];
    let releaseListener;
    const listenerGate = new Promise(resolve => { releaseListener = resolve; });
    GenericServer.instance = { isIDE: false, logLevel: 99 };
    FilesWatcher.instance = { watch: value => events.push(['watch', value]) };
    manager.onNewFile(async file => {
        events.push(['new', file.contentUser]);
        file.onDelete(async () => { events.push(['delete', file.contentUser]); });
        await listenerGate;
        throw new Error('first listener failed');
    });
    t.after(() => {
        releaseListener();
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        FilesWatcher.instance = previousWatcher;
    });

    const first = manager.registerFile(document(1, 'first'));
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(events, [['new', 'first']]);
    const second = await manager.registerFile(document(2, 'second'));
    assert.equal(second.contentUser, 'second');
    assert.equal(manager.getByUri(uri), second);

    releaseListener();
    assert.equal(await first, undefined);
    assert.equal(manager.getByUri(uri), undefined);
    assert.deepEqual(events, [
        ['new', 'first'], ['watch', uri], ['delete', 'second'],
    ]);

    // A subsequent opening can recover, but has to run the new-file callbacks again.
    manager.onNewFileCb = {};
    const recovered = await manager.registerFile(document(3, 'third'));
    assert.equal(recovered.contentUser, 'third');
    assert.equal(manager.getByUri(uri), recovered);
    assert.deepEqual(events, [
        ['new', 'first'], ['watch', uri], ['delete', 'second'], ['watch', uri],
    ]);
});
