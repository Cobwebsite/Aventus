import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { InternalAventusFile } = await loadServerModule('files/AventusFile.ts');

function file(content = 'hello') {
    const document = TextDocument.create('file:///d%3A/app/src/view.wcl.avt', 'typescript', 1, content);
    return new InternalAventusFile(document);
}

test('Aventus file exposes document metadata and separates internal content when requested', () => {
    const current = file('user');
    assert.equal(current.name, 'view.wcl.avt');
    assert.equal(current.shortname, 'view.wcl.avt');
    assert.equal(current.folderUri, 'file:///d%3A/app/src');
    assert.equal(current.folderPath, 'd:/app/src');
    assert.equal(current.contentUser, 'user');
    current.setDocumentInternal(TextDocument.create(current.uri, 'typescript', 2, 'generated'));
    assert.equal(current.contentInternal, 'generated');
    assert.equal(current.contentUser, 'user');
    assert.equal(current.versionInternal, 2);
});

test('Aventus file merges builds and deduplicates diagnostics', async () => {
    const current = file();
    const build = { name: 'app' };
    const firstBuild = current.onGetBuild(() => [build]);
    current.onGetBuild(() => [build]);
    current.onGetBuild(() => null);
    assert.deepEqual(current.getBuild(), [build]);
    current.removeOnGetBuild(firstBuild);
    assert.deepEqual(current.getBuild(), [build]);

    const diagnostic = {
        message: 'Problem',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
    };
    current.onValidate(async () => [diagnostic]);
    current.onValidate(async () => [{ ...diagnostic }]);
    assert.deepEqual(await current.validate(false), [diagnostic]);
});

test('Aventus file combines completion and formatting results without duplicates', async () => {
    const current = file('hello');
    const position = { line: 0, character: 2 };
    current.onCompletion(async () => ({ isIncomplete: false, items: [{ label: 'one' }] }));
    current.onCompletion(async () => ({ isIncomplete: false, items: [{ label: 'one' }, { label: 'two' }] }));
    assert.deepEqual((await current.getCompletion(position)).items.map(item => item.label), ['one', 'two']);

    const edit = { range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }, newText: 'world' };
    current.onFormatting(async (_file, range, options) => {
        assert.equal(range.end.character, 5);
        assert.equal(options.tabSize, 4);
        return [edit];
    });
    current.onFormatting(async () => [{ ...edit }]);
    assert.deepEqual(await current.getFormatting(), [edit]);
});

test('Aventus file combines navigation and code action callbacks', async () => {
    const current = file();
    const position = { line: 0, character: 1 };
    current.onHover(async () => null);
    current.onHover(async () => ({ contents: 'hover' }));
    assert.deepEqual(await current.getHover(position), { contents: 'hover' });
    current.onDefinition(async () => null);
    current.onDefinition(async () => [{ uri: 'file:///target', range: {} }]);
    assert.equal((await current.getDefinition(position))[0].uri, 'file:///target');
    current.onReferences(async () => [{ uri: 'file:///a', range: {} }]);
    current.onReferences(async () => [{ uri: 'file:///b', range: {} }]);
    assert.deepEqual((await current.getReferences(position)).map(item => item.uri), ['file:///a', 'file:///b']);
    current.onCodeAction(async () => [{ title: 'Fix A' }]);
    current.onCodeAction(async () => [{ title: 'Fix B' }]);
    assert.deepEqual((await current.getCodeAction({})).map(item => item.title), ['Fix A', 'Fix B']);
    current.onCodeLens(async () => [{ command: { title: 'Run' } }]);
    assert.equal((await current.getCodeLens()).length, 1);
    current.onRename(async () => null);
    current.onRename(async () => ({ changes: { 'file:///a': [] } }));
    assert.deepEqual(await current.getRename(position, 'newName'), { changes: { 'file:///a': [] } });
});

test('Aventus file calls save/delete subscribers and stops removed callbacks', async () => {
    const current = file();
    const calls = [];
    const removed = current.onSave(async () => calls.push('removed'));
    current.removeOnSave(removed);
    current.onSave(async () => calls.push('save'));
    current.onDelete(async () => calls.push('delete'));
    await current.triggerSave();
    await current.triggerDelete();
    await current.triggerSave();
    assert.deepEqual(calls, ['save', 'delete']);
});

test('Aventus file applies disjoint edits and notifies content subscribers', async () => {
    const current = file('ab cd');
    const observed = [];
    current.onContentChange(async changed => observed.push(changed.contentUser));
    try {
        await current.applyTextEdits([
            { range: { start: { line: 0, character: 0 }, end: { line: 0, character: 2 } }, newText: 'XY' },
            { range: { start: { line: 0, character: 3 }, end: { line: 0, character: 5 } }, newText: 'ZZ' },
        ]);
        assert.equal(current.contentUser, 'XY ZZ');
        assert.equal(current.contentInternal, 'XY ZZ');
        assert.equal(current.versionUser, 2);
        assert.deepEqual(observed, ['XY ZZ']);
    } finally {
        clearTimeout(current.delayValidate);
    }
});

test('Aventus file rejects a content change when a guard denies it', async () => {
    const current = file('old');
    const guard = current.onCanContentChange(() => false);
    await current.triggerContentChange(TextDocument.create(current.uri, 'typescript', 2, 'new'));
    assert.equal(current.contentUser, 'old');
    current.removeOnCanContentChange(guard);
    try {
        await current.triggerContentChange(TextDocument.create(current.uri, 'typescript', 2, 'new'));
        assert.equal(current.contentUser, 'new');
    } finally {
        clearTimeout(current.delayValidate);
    }
});
