import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { FilesManager } = await loadServerModule('files/FilesManager.ts');

test('concurrent first template completions wait for the same asynchronous save callback', async () => {
    const uri = 'file:///workspace/template.avt.ts';
    const document = TextDocument.create(uri, 'typescript', 1, 'export default {}');
    const manager = Object.create(FilesManager.prototype);
    manager.files = {};
    let releaseSave;
    const gate = new Promise(resolve => { releaseSave = resolve; });
    const events = [];
    let saves = 0;
    manager.registerFile = async input => {
        manager.files[input.uri] = {
            triggerSave: async () => {
                saves++;
                events.push('save started');
                await gate;
                events.push('save finished');
            },
            getCompletion: async () => {
                events.push('completion');
                return { isIncomplete: false, items: [] };
            },
        };
    };
    try {
        const first = manager.onCompletion(document, { line: 0, character: 0 });
        const second = manager.onCompletion(document, { line: 0, character: 0 });
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(events, ['save started']);
        releaseSave();
        assert.deepEqual(await Promise.all([first, second]), [
            { isIncomplete: false, items: [] },
            { isIncomplete: false, items: [] },
        ]);
        assert.equal(saves, 1);
        assert.deepEqual(events, ['save started', 'save finished', 'completion', 'completion']);
    } finally {
        releaseSave();
    }
});

test('failed template initialization reaches the request and can be retried', async () => {
    const uri = 'file:///workspace/template.avt.ts';
    const document = TextDocument.create(uri, 'typescript', 1, 'export default {}');
    const manager = Object.create(FilesManager.prototype);
    manager.files = {};
    let saves = 0;
    manager.registerFile = async input => {
        manager.files[input.uri] = {
            triggerSave: async () => {
                if (++saves === 1) throw Error('template preparation failed');
            },
            getCompletion: async () => ({ isIncomplete: false, items: [] }),
        };
    };

    await assert.rejects(manager.onCompletion(document, { line: 0, character: 0 }), /template preparation failed/);
    assert.deepEqual(await manager.onCompletion(document, { line: 0, character: 0 }),
        { isIncomplete: false, items: [] });
    assert.equal(saves, 2);
});
