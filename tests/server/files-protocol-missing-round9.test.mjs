import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { GenericServer }, { FilesWatcher }] = await loadServerModules([
    'files/FilesManager.ts', 'GenericServer.ts', 'files/FilesWatcher.ts',
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

test('LSP requests for an unregistered ordinary file return empty responses without registering it', async () => {
    const current = manager();
    const document = TextDocument.create('file:///d%3A/unknown.wcl.avt', 'typescript', 1, 'unknown');
    const position = { line: 0, character: 0 };
    const range = { start: position, end: position };
    const item = { label: 'unknown' };
    assert.deepEqual(await current.onCompletion(document, position), { isIncomplete: false, items: [] });
    assert.equal(await current.onCompletionResolve(document, item), item);
    assert.equal(await current.onHover(document, position), null);
    assert.equal(await current.onDefinition(document, position), null);
    assert.deepEqual(await current.onFormatting(document, { tabSize: 4, insertSpaces: true }), []);
    assert.deepEqual(await current.onCodeAction(document, range), []);
    assert.deepEqual(await current.onReferences(document, position), []);
    assert.deepEqual(await current.onCodeLens(document), []);
    assert.equal(await current.onRename(document, position, 'next'), null);
    assert.deepEqual(current.getUris(), []);
});

test('a template LSP request lazily registers the file once and saves it before dispatch', async () => {
    const current = manager();
    const uri = 'file:///d%3A/template.avt.ts';
    const document = TextDocument.create(uri, 'typescript', 1, 'export class Template {}');
    const previousServer = GenericServer.instance;
    const previousWatcher = FilesWatcher.instance;
    const events = [];
    GenericServer.instance = { isIDE: false, logLevel: 99 };
    FilesWatcher.instance = { watch: value => events.push(['watch', value]) };
    current.onNewFile(async file => {
        events.push(['new', file.uri]);
        file.onSave(async () => events.push(['save', file.uri]));
        file.getHover = () => ({ contents: 'template' });
    });
    try {
        assert.deepEqual(await current.onHover(document, { line: 0, character: 0 }), { contents: 'template' });
        assert.deepEqual(await current.onHover(document, { line: 0, character: 1 }), { contents: 'template' });
        assert.deepEqual(events, [['new', uri], ['watch', uri], ['save', uri]]);
        assert.deepEqual(current.getUris(), [uri]);
    } finally {
        for (const file of Object.values(current.files)) clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        FilesWatcher.instance = previousWatcher;
    }
});
