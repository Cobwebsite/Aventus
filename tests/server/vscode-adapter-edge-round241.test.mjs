import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { VsCodeConnection } = await loadServerModule('vscode/Connection.ts');

function adapter() {
    const handlers = {};
    const document = TextDocument.create('file:///workspace/view.wcs.avt', 'aventus-scss', 3, '.root {}');
    const instance = Object.create(VsCodeConnection.prototype);
    instance.documents = { get: uri => uri === document.uri ? document : undefined };
    instance._connection = new Proxy({}, {
        get(_target, name) {
            if (String(name).startsWith('on')) return callback => { handlers[name] = callback; };
        },
    });
    return { instance, handlers, document };
}

test('definition adapter preserves null and multiple targets but unwraps exactly one target', async () => {
    const { instance, handlers, document } = adapter();
    const position = { line: 0, character: 1 };
    const params = { textDocument: { uri: document.uri }, position };
    const targets = [
        { uri: 'file:///workspace/first.wcs.avt', range: { start: position, end: position } },
        { uri: 'file:///workspace/second.wcs.avt', range: { start: position, end: position } },
    ];
    const seen = [];
    let next = null;
    instance.onDefinition(async (...args) => { seen.push(args); return next; });

    assert.equal(await handlers.onDefinition(params), null);
    next = [];
    assert.deepEqual(await handlers.onDefinition(params), []);
    next = targets.slice(0, 1);
    assert.deepEqual(await handlers.onDefinition(params), targets[0]);
    next = targets;
    assert.deepEqual(await handlers.onDefinition(params), targets);
    assert.deepEqual(seen, Array.from({ length: 4 }, () => [document, position]));
});

test('color, command, configuration and custom request adapters forward arguments and async results', async () => {
    const { instance, handlers, document } = adapter();
    const missingUri = 'file:///workspace/missing.wcs.avt';
    const start = { line: 0, character: 0 };
    const range = { start, end: { line: 0, character: 5 } };
    const color = { red: 1, green: 0.5, blue: 0, alpha: 1 };
    const calls = [];
    instance.onDocumentColor(async value => { calls.push(['documentColor', value]); return [{ range, color }]; });
    instance.onColorPresentation(async (...args) => { calls.push(['colorPresentation', ...args]); return [{ label: 'orange' }]; });
    instance.onExecuteCommand(async value => { calls.push(['command', value]); return 'executed'; });
    instance.onDidChangeConfiguration(async () => { calls.push(['configuration']); return 'loaded'; });
    instance.onRequest(async (...args) => { calls.push(['request', ...args]); return { ok: true }; });

    assert.deepEqual(await handlers.onDocumentColor({ textDocument: { uri: document.uri } }), [{ range, color }]);
    assert.deepEqual(await handlers.onDocumentColor({ textDocument: { uri: missingUri } }), [{ range, color }]);
    assert.deepEqual(await handlers.onColorPresentation({ textDocument: { uri: document.uri }, range, color }), [{ label: 'orange' }]);
    const command = { command: 'aventus.example', arguments: ['x'] };
    assert.equal(await handlers.onExecuteCommand(command), undefined);
    assert.equal(await handlers.onDidChangeConfiguration({ settings: { aventus: {} } }), undefined);
    assert.deepEqual(await handlers.onRequest('aventus/example', { key: 1 }), { ok: true });
    assert.deepEqual(calls, [
        ['documentColor', document],
        ['documentColor', undefined],
        ['colorPresentation', document, range, color],
        ['command', command],
        ['configuration'],
        ['request', 'aventus/example', { key: 1 }],
    ]);
});
