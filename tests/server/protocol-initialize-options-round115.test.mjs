import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { VsCodeConnection } = await loadServerModule('vscode/Connection.ts');

test('LSP initialize without initializationOptions fails before invoking the server callback, then accepts a valid retry', () => {
    const handlers = {};
    const adapter = Object.create(VsCodeConnection.prototype);
    adapter._connection = { onInitialize: callback => { handlers.initialize = callback; } };
    const received = [];
    adapter.onInitialize(params => received.push(params));

    assert.throws(() => handlers.initialize({ workspaceFolders: null }), TypeError);
    assert.deepEqual(received, []);

    const result = handlers.initialize({
        workspaceFolders: [{ uri: 'file:///workspace', name: 'workspace' }],
        initializationOptions: { savePath: 'D:/save', extensionPath: 'D:/extension' },
    });
    assert.deepEqual(received, [{
        workspaceFolders: [{ uri: 'file:///workspace', name: 'workspace' }],
        savePath: 'D:/save', extensionPath: 'D:/extension', isIDE: true,
    }]);
    assert.ok(result.capabilities);
    assert.equal(result.capabilities.completionProvider.resolveProvider, true);
});
