import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { GenericServer }, { SettingsManager }, { FilesWatcher }] = await loadServerModules([
    'files/FilesManager.ts', 'GenericServer.ts', 'settings/Settings.ts', 'files/FilesWatcher.ts',
]);

function manager() {
    const instance = Object.create(FilesManager.prototype);
    instance.files = {};
    instance.lockedUpdatedUri = {};
    instance.loadingInProgress = false;
    instance.onNewFileCb = {};
    instance.onFileRemoveCb = {};
    return instance;
}

test('file registration waits for all new-file listeners and ignores removed listeners', async () => {
    const current = manager();
    const previous = GenericServer.instance;
    GenericServer.instance = { logLevel: 99 };
    const seen = [];
    const removed = current.onNewFile(async () => seen.push('removed'));
    current.removeOnNewFile(removed);
    current.onNewFile(async file => {
        await new Promise(resolve => setTimeout(resolve, 5));
        seen.push(file.contentUser);
    });
    try {
        await current.triggerOnNewFile(TextDocument.create('file:///d%3A/a.wcl.avt', 'typescript', 1, 'ready'));
        assert.deepEqual(seen, ['ready']);
        assert.equal(current.getUris().length, 1);
    } finally {
        GenericServer.instance = previous;
    }
});

test('loading files defers config registration but accepts ordinary Aventus documents', async () => {
    const current = manager();
    const previous = GenericServer.instance;
    GenericServer.instance = { logLevel: 99 };
    current.loadingInProgress = true;
    try {
        await current.triggerOnNewFile(TextDocument.create('file:///d%3A/aventus.conf.avt', 'json', 1, '{}'));
        assert.deepEqual(current.getUris(), []);
        await current.triggerOnNewFile(TextDocument.create('file:///d%3A/one.wcl.avt', 'typescript', 1, 'x'));
        assert.deepEqual(current.getUris(), ['file:///d%3A/one.wcl.avt']);
    } finally {
        GenericServer.instance = previous;
    }
});

test('deletion clears diagnostics separately for each build and awaits file cleanup', async () => {
    const current = manager();
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    const previousWatcher = FilesWatcher.instance;
    const sent = [];
    const events = [];
    GenericServer.instance = { logLevel: 99, connection: { sendDiagnostics: (params, build) => sent.push([params, build]) } };
    SettingsManager.instance = { settings: { errorByBuild: true } };
    FilesWatcher.instance = { unwatch: uri => events.push(['unwatch', uri]) };
    const uri = 'file:///d%3A/a.wcl.avt';
    current.files[uri] = {
        getBuild: () => [{ buildConfig: { fullname: 'first' } }, { buildConfig: { fullname: 'second' } }],
        triggerDelete: async () => { await new Promise(resolve => setTimeout(resolve, 5)); events.push(['delete']); },
    };
    try {
        await current.onDeletedUri(uri);
        assert.deepEqual(sent, [
            [{ uri, diagnostics: [] }, 'first'],
            [{ uri, diagnostics: [] }, 'second'],
        ]);
        assert.deepEqual(events, [['delete'], ['unwatch', uri]]);
        assert.equal(current.getByUri(uri), undefined);
    } finally {
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
        FilesWatcher.instance = previousWatcher;
    }
});

test('file manager forwards each LSP request to a registered file with its arguments', async () => {
    const current = manager();
    const uri = 'file:///d%3A/a.wcl.avt';
    const document = TextDocument.create(uri, 'typescript', 1, 'value');
    const position = { line: 0, character: 2 };
    const range = { start: position, end: position };
    const options = { tabSize: 2, insertSpaces: true };
    const item = { label: 'value' };
    const calls = [];
    for (const method of ['getCompletion', 'getCompletionResolve', 'getHover', 'getDefinition',
        'getFormatting', 'getCodeAction', 'getReferences', 'getCodeLens', 'getRename']) {
        current.files[uri] ??= {};
        current.files[uri][method] = (...args) => { calls.push([method, args]); return method; };
    }
    assert.equal(await current.onCompletion(document, position), 'getCompletion');
    assert.equal(await current.onCompletionResolve(document, item), 'getCompletionResolve');
    assert.equal(await current.onHover(document, position), 'getHover');
    assert.equal(await current.onDefinition(document, position), 'getDefinition');
    assert.equal(await current.onFormatting(document, options), 'getFormatting');
    assert.equal(await current.onCodeAction(document, range), 'getCodeAction');
    assert.equal(await current.onReferences(document, position), 'getReferences');
    assert.equal(await current.onCodeLens(document), 'getCodeLens');
    assert.equal(await current.onRename(document, position, 'other'), 'getRename');
    assert.deepEqual(calls, [
        ['getCompletion', [position]], ['getCompletionResolve', [item]], ['getHover', [position]],
        ['getDefinition', [position]], ['getFormatting', [options]], ['getCodeAction', [range]],
        ['getReferences', [position]], ['getCodeLens', []], ['getRename', [position, 'other']],
    ]);
});

test('new-file callback removal preserves remaining callback and file-removal subscriptions', async () => {
    const current = manager();
    const previous = GenericServer.instance;
    GenericServer.instance = { logLevel: 99 };
    const events = [];
    const removeNew = current.onNewFile(async () => events.push('new removed'));
    current.onNewFile(async () => events.push('new kept'));
    const removeDeleted = current.onFileRemove(async () => events.push('delete removed'));
    current.onFileRemove(async () => events.push('delete kept'));
    current.removeOnNewFile(removeNew);
    current.removeOnFileRemove(removeDeleted);
    try {
        await current.triggerOnNewFile(TextDocument.create('file:///d%3A/file.wcl.avt', 'typescript', 1, 'x'));
        await current.triggerOnFileRemove('file:///d%3A/file.wcl.avt');
        assert.deepEqual(events, ['new kept', 'delete kept']);
    } finally {
        GenericServer.instance = previous;
    }
});
