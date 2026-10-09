import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [serverModule, settingsModule, watcherModule, filesModule, projectsModule, csharpModule, phpModule] = await loadServerModules([
    'GenericServer.ts', 'settings/Settings.ts', 'files/FilesWatcher.ts', 'files/FilesManager.ts',
    'project/ProjectManager.ts', 'language-services/json/CSharpManager.ts', 'language-services/json/PhpManager.ts',
]);
const { GenericServer } = serverModule;
const { SettingsManager } = settingsModule;
const { FilesWatcher } = watcherModule;
const { FilesManager } = filesModule;
const { ProjectManager } = projectsModule;
const { CSharpManager } = csharpModule;
const { PhpManager } = phpModule;

function makeServer() {
    const handlers = {};
    const connection = new Proxy({}, {
        get(_target, name) {
            if (String(name).startsWith('on')) return callback => { handlers[name] = callback; };
        },
    });
    const server = new GenericServer(connection);
    Object.defineProperty(server, 'logLevel', { value: 99 });
    return { server, handlers };
}

test('shutdown waits for watcher and file cleanup and blocks subsequent document requests', async () => {
    const { server, handlers } = makeServer();
    server.isLoading = false;
    const previous = [SettingsManager.instance, FilesWatcher.instance, FilesManager.instance, ProjectManager.instance,
        CSharpManager.instance, PhpManager.instance];
    const events = [];
    SettingsManager.instance = { settings: { watchFiles: true, useCompilators: true } };
    FilesWatcher.instance = { destroy: async () => { events.push('watcher'); } };
    FilesManager.instance = { onShutdown: async () => { events.push('files'); } };
    ProjectManager.instance = { destroyAll: () => { events.push('projects'); } };
    CSharpManager.instance = { destroy: () => { events.push('csharp'); } };
    PhpManager.instance = { destroy: () => { events.push('php'); } };
    try {
        await handlers.onShutdown();
        assert.equal(server.isDown, true);
        assert.deepEqual(events, ['watcher', 'csharp', 'php', 'projects', 'files']);
        assert.equal(await handlers.onHover({ uri: 'file:///project/a.wcl.avt' }, { line: 0, character: 0 }), null);
    } finally {
        [SettingsManager.instance, FilesWatcher.instance, FilesManager.instance, ProjectManager.instance,
            CSharpManager.instance, PhpManager.instance] = previous;
    }
});

test('shutdown leaves disabled optional services untouched but still closes projects and files', async () => {
    const { handlers } = makeServer();
    const previous = [SettingsManager.instance, FilesWatcher.instance, FilesManager.instance, ProjectManager.instance,
        CSharpManager.instance, PhpManager.instance];
    const events = [];
    SettingsManager.instance = { settings: { watchFiles: false, useCompilators: false } };
    FilesWatcher.instance = { destroy: () => { throw Error('watcher disabled'); } };
    CSharpManager.instance = { destroy: () => { throw Error('compiler disabled'); } };
    PhpManager.instance = { destroy: () => { throw Error('compiler disabled'); } };
    ProjectManager.instance = { destroyAll: () => { events.push('projects'); } };
    FilesManager.instance = { onShutdown: async () => { events.push('files'); } };
    try {
        await handlers.onShutdown();
        assert.deepEqual(events, ['projects', 'files']);
    } finally {
        [SettingsManager.instance, FilesWatcher.instance, FilesManager.instance, ProjectManager.instance,
            CSharpManager.instance, PhpManager.instance] = previous;
    }
});
