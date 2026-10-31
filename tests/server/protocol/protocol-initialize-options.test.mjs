import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { VsCodeConnection } = await loadServerModule('vscode/Connection.ts');

test('LSP initialize accepts missing initializationOptions and explicit paths', () => {
    const handlers = {};
    const adapter = Object.create(VsCodeConnection.prototype);
    adapter._connection = { onInitialize: callback => { handlers.initialize = callback; } };
    const received = [];
    adapter.onInitialize(params => received.push(params));

    const defaultResult = handlers.initialize({ workspaceFolders: null });
    assert.deepEqual(received, [{
        workspaceFolders: null, savePath: undefined, extensionPath: undefined, isIDE: true,
    }]);
    assert.ok(defaultResult.capabilities);

    const result = handlers.initialize({
        workspaceFolders: [{ uri: 'file:///workspace', name: 'workspace' }],
        initializationOptions: { savePath: 'D:/save', extensionPath: 'D:/extension' },
    });
    assert.deepEqual(received[1], {
        workspaceFolders: [{ uri: 'file:///workspace', name: 'workspace' }],
        savePath: 'D:/save', extensionPath: 'D:/extension', isIDE: true,
    });
    assert.ok(result.capabilities);
    assert.equal(result.capabilities.completionProvider.resolveProvider, true);
});
