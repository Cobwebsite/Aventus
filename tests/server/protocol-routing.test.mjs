import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GenericServer }, { FilesManager }, { SettingsManager }] = await loadServerModules([
    'GenericServer.ts', 'files/FilesManager.ts', 'settings/Settings.ts',
]);

function server() {
    const handlers = {};
    const connection = new Proxy({ open: () => handlers.opened = true }, {
        get(target, key) {
            if (key in target) return target[key];
            if (String(key).startsWith('on')) return cb => { handlers[key] = cb; };
        },
    });
    const instance = new GenericServer(connection);
    Object.defineProperty(instance, 'logLevel', { value: 99 });
    return { instance, handlers };
}

test('server binds protocol handlers, opens connection and remembers initialization options', () => {
    const { instance, handlers } = server();
    const expected = ['onInitialize', 'onInitialized', 'onShutdown', 'onCompletion', 'onCompletionResolve', 'onHover',
        'onDefinition', 'onDocumentFormatting', 'onCodeAction', 'onCodeLens', 'onReferences', 'onRenameRequest',
        'onDocumentColor', 'onColorPresentation', 'onExecuteCommand', 'onDidChangeConfiguration', 'onRequest'];
    for (const name of expected) assert.equal(typeof handlers[name], 'function', name);
    instance.start();
    assert.equal(handlers.opened, true);
    handlers.onInitialize({ workspaceFolders: [{ uri: 'file:///workspace-a' }, { uri: 'file:///workspace-b' }],
        savePath: 'save', extensionPath: 'extension', isIDE: false, noBuild: true });
    assert.deepEqual(instance.workspaces, ['file:///workspace-a', 'file:///workspace-b']);
    assert.equal(GenericServer.getWorkspaceUri(), 'file:///workspace-a');
    assert.equal(GenericServer.savePath, 'save');
    assert.equal(GenericServer.extensionPath, 'extension');
    assert.equal(GenericServer.noBuild, true);
});

test('IDE initialization exposes resource paths, enables update check and defaults build mode', () => {
    const { instance, handlers } = server();
    const calls = [];
    instance.runUpdate = () => calls.push('update');
    handlers.onInitialize({
        workspaceFolders: [], savePath: 'D:/data', extensionPath: 'D:/extension', isIDE: true,
    });
    assert.equal(GenericServer.isIDE, true);
    assert.equal(GenericServer.noBuild, false);
    assert.equal(GenericServer.savePath, 'D:/data');
    assert.equal(GenericServer.extensionPath, 'D:/extension');
    assert.equal(GenericServer.getWorkspaceUri(), '');
    assert.deepEqual(calls, ['update']);
});

test('server rejects requests while loading, after shutdown, for missing and unrelated documents', async () => {
    const { instance, handlers } = server();
    const aventus = TextDocument.create('file:///x.wcl.avt', 'typescript', 1, 'a');
    const other = TextDocument.create('file:///x.ts', 'typescript', 1, 'a');
    const position = { line: 0, character: 0 };
    assert.equal(await handlers.onHover(aventus, position), null);
    instance.isLoading = false;
    assert.equal(await handlers.onHover(undefined, position), null);
    assert.equal(await handlers.onHover(other, position), null);
    assert.deepEqual(await handlers.onCompletionResolve(other, { label: 'x' }), { label: 'x' });
    instance.isDown = true;
    assert.equal(await handlers.onDefinition(aventus, position), null);
});

test('server routes all document requests to file manager when document is allowed', async () => {
    const { instance, handlers } = server();
    instance.isLoading = false;
    const document = TextDocument.create('file:///x.wcl.avt', 'typescript', 1, 'a');
    const calls = [];
    const methods = ['onCompletion', 'onCompletionResolve', 'onHover', 'onDefinition', 'onFormatting', 'onCodeAction',
        'onCodeLens', 'onReferences', 'onRename'];
    const fake = Object.fromEntries(methods.map(name => [name, async (...args) => {
        calls.push([name, ...args]);
        return name;
    }]));
    const original = FilesManager.instance;
    FilesManager.instance = fake;
    try {
        const position = { line: 0, character: 0 };
        const range = { start: position, end: position };
        const item = { label: 'x' };
        const options = { tabSize: 4, insertSpaces: true };
        const requests = [
            ['onCompletion', [document, position], 'onCompletion'],
            ['onCompletionResolve', [document, item], 'onCompletionResolve'],
            ['onHover', [document, position], 'onHover'],
            ['onDefinition', [document, position], 'onDefinition'],
            ['onDocumentFormatting', [document, options], 'onFormatting'],
            ['onCodeAction', [document, range], 'onCodeAction'],
            ['onCodeLens', [document], 'onCodeLens'],
            ['onReferences', [document, position], 'onReferences'],
            ['onRenameRequest', [document, position, 'new'], 'onRename'],
        ];
        for (const [handler, args, name] of requests) assert.equal(await handlers[handler](...args), name);
        assert.deepEqual(calls, requests.map(([, args, name]) => [name, ...args]));
    } finally {
        FilesManager.instance = original;
    }
});

test('initialization loads settings before starting services and configuration changes reload them', async () => {
    const { instance, handlers } = server();
    const steps = [];
    instance.checkNodeJs = async () => { steps.push('node'); return true; };
    instance.startServer = async () => { steps.push('start'); };
    instance.connection.getSettings = async () => ({ watchFiles: false });
    instance.connection.getSettingsHtml = async () => ({ customData: ['custom.json'] });
    const oldSettings = SettingsManager.instance;
    SettingsManager.instance = {
        initSettings: value => steps.push(['settings', value]),
        setSettingsHtml: value => steps.push(['html', value]),
    };
    try {
        await handlers.onInitialized();
        await handlers.onDidChangeConfiguration();
        assert.deepEqual(steps, [
            'node', ['settings', { watchFiles: false }], ['html', { customData: ['custom.json'] }], 'start',
            ['settings', { watchFiles: false }], ['html', { customData: ['custom.json'] }],
        ]);
    } finally {
        SettingsManager.instance = oldSettings;
    }
});
