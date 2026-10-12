import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { FilesManager } = await loadServerModule('files/FilesManager.ts');

test('first template completion can finish before its asynchronous save callback', async () => {
    const uri = 'file:///workspace/template.avt.ts';
    const document = TextDocument.create(uri, 'typescript', 1, 'export default {}');
    const manager = Object.create(FilesManager.prototype);
    manager.files = {};
    let releaseSave;
    const gate = new Promise(resolve => { releaseSave = resolve; });
    const events = [];
    manager.registerFile = async input => {
        manager.files[input.uri] = {
            triggerSave: async () => {
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
        const result = await manager.onCompletion(document, { line: 0, character: 0 });
        assert.deepEqual(result, { isIncomplete: false, items: [] });
        assert.deepEqual(events, ['save started', 'completion']);
        releaseSave();
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(events, ['save started', 'completion', 'save finished']);
    } finally {
        releaseSave();
    }
});
