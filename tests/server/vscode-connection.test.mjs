import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ VsCodeConnection }, { GenericServer }, { FilesManager }] = await loadServerModules([
    'vscode/Connection.ts', 'GenericServer.ts', 'files/FilesManager.ts',
]);

function connection() {
    const handlers = {};
    const calls = [];
    const document = TextDocument.create('file:///workspace/view.wcl.avt', 'typescript', 1, 'view');
    const instance = Object.create(VsCodeConnection.prototype);
    instance.documents = { get: uri => uri === document.uri ? document : undefined };
    instance._connection = new Proxy({}, {
        get(_target, key) {
            if (String(key).startsWith('on')) return cb => { handlers[key] = cb; };
            if (key === 'sendDiagnostics') return value => calls.push(['diagnostics', value]);
            if (key === 'sendNotification') return (name, params) => calls.push(['notification', name, params]);
        },
    });
    return { instance, handlers, calls, document };
}

test('VS Code initialization advertises supported LSP capabilities and forwards workspace options', () => {
    const { instance, handlers } = connection();
    let received;
    instance.onInitialize(params => { received = params; });
    const result = handlers.onInitialize({
        workspaceFolders: [{ uri: 'file:///workspace' }],
        initializationOptions: { savePath: '/save', extensionPath: '/extension' },
    });
    assert.deepEqual(received, {
        workspaceFolders: [{ uri: 'file:///workspace' }], savePath: '/save', extensionPath: '/extension', isIDE: true,
    });
    const capabilities = result.capabilities;
    assert.equal(capabilities.textDocumentSync, 2);
    assert.equal(capabilities.completionProvider.resolveProvider, true);
    assert.equal(capabilities.renameProvider, true);
    for (const name of ['hoverProvider', 'definitionProvider', 'documentFormattingProvider', 'codeActionProvider',
        'referencesProvider', 'codeLensProvider', 'colorProvider', 'executeCommandProvider']) {
        assert.ok(capabilities[name], name);
    }
    assert.ok(Array.isArray(capabilities.executeCommandProvider.commands));
});

test('VS Code adapter maps document requests and handles absent documents', async () => {
    const { instance, handlers, document } = connection();
    const pos = { line: 0, character: 2 };
    const args = { textDocument: { uri: document.uri }, position: pos };
    const missing = { textDocument: { uri: 'file:///missing.wcl.avt' }, position: pos };
    const seen = [];
    instance.onCompletion(async (...values) => { seen.push(['completion', ...values]); return { isIncomplete: false, items: [] }; });
    instance.onHover(async (...values) => { seen.push(['hover', ...values]); return { contents: 'ok' }; });
    instance.onDefinition(async (...values) => { seen.push(['definition', ...values]); return [{ uri: 'file:///target', range: {} }]; });
    assert.deepEqual(await handlers.onCompletion(args), { isIncomplete: false, items: [] });
    assert.deepEqual(await handlers.onHover(missing), { contents: 'ok' });
    assert.deepEqual(await handlers.onDefinition(args), { uri: 'file:///target', range: {} });
    assert.deepEqual(seen, [
        ['completion', document, pos], ['hover', undefined, pos], ['definition', document, pos],
    ]);
});

test('VS Code adapter forwards formatting, code actions, references, rename and code lens', async () => {
    const { instance, handlers, document } = connection();
    const pos = { line: 0, character: 0 };
    const range = { start: pos, end: pos };
    const options = { tabSize: 4, insertSpaces: true };
    const seen = [];
    const definitions = [
        ['onDocumentFormatting', 'onDocumentFormatting', { textDocument: { uri: document.uri }, options }, [document, options]],
        ['onCodeAction', 'onCodeAction', { textDocument: { uri: document.uri }, range }, [document, range]],
        ['onReferences', 'onReferences', { textDocument: { uri: document.uri }, position: pos }, [document, pos]],
        ['onRenameRequest', 'onRenameRequest', { textDocument: { uri: document.uri }, position: pos, newName: 'next' }, [document, pos, 'next']],
        ['onCodeLens', 'onCodeLens', { textDocument: { uri: document.uri } }, [document]],
    ];
    for (const [method, handler] of definitions) instance[method](async (...values) => { seen.push([handler, ...values]); return handler; });
    for (const [, handler, params] of definitions) assert.equal(await handlers[handler](params), handler);
    assert.deepEqual(seen, definitions.map(([, handler, , values]) => [handler, ...values]));
});

test('VS Code adapter resolves completion only when URI is available and forwards diagnostics', async () => {
    const { instance, handlers, calls, document } = connection();
    const seen = [];
    instance.onCompletionResolve(async (...values) => { seen.push(values); return { label: 'resolved' }; });
    assert.deepEqual(await handlers.onCompletionResolve({ label: 'plain' }), { label: 'plain' });
    assert.deepEqual(await handlers.onCompletionResolve({ label: 'one', data: { uri: document.uri } }), { label: 'resolved' });
    assert.deepEqual(seen, [[document, { label: 'one', data: { uri: document.uri } }]]);
    instance.sendDiagnostics({ uri: document.uri, diagnostics: [] });
    instance.sendNotification('aventus/event', ['value']);
    assert.deepEqual(calls, [
        ['diagnostics', { uri: document.uri, diagnostics: [] }],
        ['notification', 'aventus/event', ['value']],
    ]);
});

test('VS Code document lifecycle forwards changes, save and close only for allowed documents', () => {
    const { instance, document } = connection();
    const events = {};
    const calls = [];
    instance.documents = {
        onDidChangeContent: cb => { events.change = cb; },
        onDidSave: cb => { events.save = cb; },
        onDidClose: cb => { events.close = cb; },
    };
    const oldServer = GenericServer.instance;
    const oldFiles = FilesManager.instance;
    GenericServer.instance = { isDown: false, isLoading: false };
    FilesManager.instance = {
        onContentChange: value => calls.push(['change', value]),
        preventUpdateUri: value => calls.push(['prevent', value]),
        onSave: value => calls.push(['save', value]),
        onClose: value => calls.push(['close', value]),
    };
    try {
        instance.addDocumentsAction();
        assert.deepEqual(Object.keys(events).sort(), ['change', 'close', 'save']);
        const unrelated = TextDocument.create('file:///workspace/view.ts', 'typescript', 1, 'x');
        events.change({ document: unrelated });
        events.save({ document: unrelated });
        events.close({ document: unrelated });
        assert.deepEqual(calls, []);
        assert.equal(GenericServer.isAllowed(document), true);
        events.change({ document });
        events.save({ document });
        events.close({ document });
        assert.deepEqual(calls, [
            ['change', document], ['prevent', document.uri], ['save', document], ['close', document],
        ]);
    } finally {
        GenericServer.instance = oldServer;
        FilesManager.instance = oldFiles;
    }
});
