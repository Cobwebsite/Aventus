import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ FilesManager }, { FilesWatcher }, { GenericServer }] = await loadServerModules([
    'files/FilesManager.ts', 'files/FilesWatcher.ts', 'GenericServer.ts',
]);

test('a failed first registration does not discard a newer registration of the same URI', async t => {
    const manager = Object.create(FilesManager.prototype);
    manager.pendingRegistrations = new Map();
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
        if (file.contentUser === 'first') {
            await listenerGate;
            throw new Error('first listener failed');
        }
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
    const secondRegistration = manager.registerFile(document(2, 'second'));

    releaseListener();
    assert.equal(await first, undefined);
    const second = await secondRegistration;
    assert.equal(second.contentUser, 'second');
    assert.equal(manager.getByUri(uri), second);
    assert.deepEqual(events, [
        ['new', 'first'], ['delete', 'first'], ['new', 'second'], ['watch', uri],
    ]);
});

test('registration of a different URI proceeds while the first URI is pending', { timeout: 5_000 }, async t => {
    const manager = Object.create(FilesManager.prototype);
    manager.pendingRegistrations = new Map();
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    const previousServer = GenericServer.instance;
    const previousWatcher = FilesWatcher.instance;
    GenericServer.instance = { isIDE: false, logLevel: 99 };
    FilesWatcher.instance = { watch() {} };
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    manager.onNewFile(async file => {
        if (file.uri.endsWith('/first.wcl.avt')) await gate;
    });
    t.after(() => {
        release();
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        FilesWatcher.instance = previousWatcher;
    });

    const first = manager.registerFile(TextDocument.create('file:///round243/first.wcl.avt', 'typescript', 1, 'first'));
    const second = await manager.registerFile(TextDocument.create('file:///round243/second.wcl.avt', 'typescript', 1, 'second'));
    assert.equal(second.contentUser, 'second');
    release();
    assert.equal((await first).contentUser, 'first');
});

test('three registrations of the same URI are processed in arrival order', async t => {
    const manager = Object.create(FilesManager.prototype);
    manager.pendingRegistrations = new Map();
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false, onNewFileCb: {}, onFileRemoveCb: {} });
    const previousServer = GenericServer.instance;
    const previousWatcher = FilesWatcher.instance;
    GenericServer.instance = { isIDE: false, logLevel: 99 };
    FilesWatcher.instance = { watch() {} };
    const uri = 'file:///round243/ordered.wcl.avt';
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const created = [];
    manager.onNewFile(async file => {
        created.push(file.contentUser);
        if (file.contentUser === 'first') await gate;
    });
    t.after(() => {
        release();
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        FilesWatcher.instance = previousWatcher;
    });
    const document = (version, content) => TextDocument.create(uri, 'typescript', version, content);
    const first = manager.registerFile(document(1, 'first'));
    const second = manager.registerFile(document(2, 'second'));
    const third = manager.registerFile(document(3, 'third'));
    release();
    await Promise.all([first, second, third]);
    assert.deepEqual(created, ['first']);
    assert.equal(manager.getByUri(uri).contentUser, 'third');
});
