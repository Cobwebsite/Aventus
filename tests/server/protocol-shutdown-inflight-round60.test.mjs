import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GenericServer }, { SettingsManager }, { FilesWatcher }, { FilesManager },
    { ProjectManager }, { CSharpManager }, { PhpManager }] = await loadServerModules([
    'GenericServer.ts', 'settings/Settings.ts', 'files/FilesWatcher.ts', 'files/FilesManager.ts',
    'project/ProjectManager.ts', 'language-services/json/CSharpManager.ts',
    'language-services/json/PhpManager.ts',
]);

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

function makeServer() {
    const handlers = {};
    const connection = new Proxy({}, { get(_target, key) {
        if (String(key).startsWith('on')) return callback => { handlers[key] = callback; };
    } });
    const server = new GenericServer(connection);
    Object.defineProperty(server, 'logLevel', { value: 99 });
    server.isLoading = false;
    return { server, handlers };
}

test('shutdown rejects late document requests while waiting for watcher and file cleanup', async () => {
    const previous = [SettingsManager.instance, FilesWatcher.instance, FilesManager.instance,
        ProjectManager.instance, CSharpManager.instance, PhpManager.instance];
    const watcherEntered = deferred();
    const releaseWatcher = deferred();
    const filesEntered = deferred();
    const releaseFiles = deferred();
    const events = [];
    const { server, handlers } = makeServer();
    SettingsManager.instance = { settings: { watchFiles: true, useCompilators: true } };
    FilesWatcher.instance = { destroy: async () => {
        events.push('watcher:start');
        watcherEntered.resolve();
        await releaseWatcher.promise;
        events.push('watcher:end');
    } };
    CSharpManager.instance = { destroy: () => events.push('csharp') };
    PhpManager.instance = { destroy: () => events.push('php') };
    ProjectManager.instance = { destroyAll: () => events.push('projects') };
    FilesManager.instance = {
        onShutdown: async () => {
            events.push('files:start');
            filesEntered.resolve();
            await releaseFiles.promise;
            events.push('files:end');
        },
        onHover: () => { throw Error('late hover reached a destroyed manager'); },
        onCompletion: () => { throw Error('late completion reached a destroyed manager'); },
    };
    try {
        let settled = false;
        const shutdown = handlers.onShutdown().then(() => { settled = true; });
        await watcherEntered.promise;
        assert.equal(server.isDown, true);
        assert.equal(settled, false);
        const document = TextDocument.create('file:///shutdown.wcl.avt', 'typescript', 1, 'class Shutdown {}');
        const position = { line: 0, character: 1 };
        assert.equal(await handlers.onHover(document, position), null);
        assert.equal(await handlers.onCompletion(document, position), null);
        assert.deepEqual(events, ['watcher:start']);
        releaseWatcher.resolve();
        await filesEntered.promise;
        assert.equal(settled, false);
        assert.deepEqual(events, ['watcher:start', 'watcher:end', 'csharp', 'php', 'projects', 'files:start']);
        assert.equal(await handlers.onHover(document, position), null);
        releaseFiles.resolve();
        await shutdown;
        assert.equal(settled, true);
        assert.equal(events.at(-1), 'files:end');
    } finally {
        releaseWatcher.resolve();
        releaseFiles.resolve();
        [SettingsManager.instance, FilesWatcher.instance, FilesManager.instance,
            ProjectManager.instance, CSharpManager.instance, PhpManager.instance] = previous;
    }
});
