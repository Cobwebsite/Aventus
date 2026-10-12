import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GenericServer }, { VsCodeConnection }, { FilesManager }, { SettingsManager }] = await loadServerModules([
    'GenericServer.ts', 'vscode/Connection.ts', 'files/FilesManager.ts', 'settings/Settings.ts',
]);

test('document notifications are admitted only after startup and suppressed again after shutdown', t => {
    const previousServer = GenericServer.instance;
    const previousFiles = FilesManager.getInstance;
    t.after(() => {
        GenericServer.instance = previousServer;
        FilesManager.getInstance = previousFiles;
    });
    const events = {};
    const calls = [];
    const adapter = Object.create(VsCodeConnection.prototype);
    adapter.documents = {
        onDidChangeContent: cb => { events.change = cb; },
        onDidSave: cb => { events.save = cb; },
        onDidClose: cb => { events.close = cb; },
    };
    FilesManager.getInstance = () => ({
        onContentChange: doc => calls.push(['change', doc.version]),
        preventUpdateUri: uri => calls.push(['prevent', uri]),
        onSave: doc => calls.push(['save', doc.version]),
        onClose: doc => calls.push(['close', doc.version]),
    });
    const server = Object.create(GenericServer.prototype);
    GenericServer.instance = server;
    const document = TextDocument.create('file:///workspace/view.wcl.avt', 'aventus', 3, 'content');
    adapter.addDocumentsAction();
    const emit = () => {
        events.change({ document });
        events.save({ document });
        events.close({ document });
    };

    server.isLoading = true;
    server.isDown = false;
    emit();
    assert.deepEqual(calls, []);
    server.isLoading = false;
    emit();
    assert.deepEqual(calls, [
        ['change', 3], ['prevent', document.uri], ['save', 3], ['close', 3],
    ]);
    server.isDown = true;
    emit();
    assert.equal(calls.length, 4);
});

test('failed HTML settings request prevents startup and can be retried without using partial settings', async t => {
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    t.after(() => {
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
    });
    const handlers = {};
    const connection = new Proxy({}, {
        get(target, key) {
            if (key in target) return target[key];
            if (String(key).startsWith('on')) return cb => { handlers[key] = cb; };
        },
    });
    const server = new GenericServer(connection);
    Object.defineProperty(server, 'logLevel', { value: 99 });
    const calls = [];
    let htmlAttempts = 0;
    server.checkNodeJs = async () => true;
    server.startServer = async () => { calls.push('start'); server.isLoading = false; };
    connection.getSettings = async () => { calls.push('settings request'); return { loadFiles: false }; };
    connection.getSettingsHtml = async () => {
        calls.push('html request');
        if (++htmlAttempts === 1) throw Error('HTML settings unavailable');
        return { customData: ['ready.json'] };
    };
    SettingsManager.instance = {
        initSettings: value => calls.push(['settings', value]),
        setSettingsHtml: value => calls.push(['html', value]),
    };
    await assert.rejects(handlers.onInitialized(), /HTML settings unavailable/);
    assert.equal(server.isLoading, true);
    assert.equal(calls.includes('start'), false);
    await handlers.onInitialized();
    assert.equal(server.isLoading, false);
    assert.deepEqual(calls, [
        'settings request', ['settings', { loadFiles: false }], 'html request',
        'settings request', ['settings', { loadFiles: false }], 'html request',
        ['html', { customData: ['ready.json'] }], 'start',
    ]);
});
