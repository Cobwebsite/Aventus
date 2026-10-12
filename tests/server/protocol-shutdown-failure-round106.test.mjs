import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GenericServer }, { SettingsManager }, { FilesWatcher }, { FilesManager }, { ProjectManager }] = await loadServerModules([
    'GenericServer.ts', 'settings/Settings.ts', 'files/FilesWatcher.ts',
    'files/FilesManager.ts', 'project/ProjectManager.ts',
]);

test('watcher cleanup failure interrupts shutdown before project and file cleanup', async t => {
    const handlers = {};
    const server = new GenericServer(new Proxy({}, {
        get(_target, name) {
            if (String(name).startsWith('on')) return callback => { handlers[name] = callback; };
        },
    }));
    Object.defineProperty(server, 'logLevel', { value: 99 });
    const previous = {
        settings: SettingsManager.instance,
        watcher: FilesWatcher.instance,
        files: FilesManager.instance,
        projects: ProjectManager.instance,
    };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        FilesWatcher.instance = previous.watcher;
        FilesManager.instance = previous.files;
        ProjectManager.instance = previous.projects;
    });
    const events = [];
    SettingsManager.instance = { settings: { watchFiles: true, useCompilators: false } };
    FilesWatcher.instance = { destroy: async () => { events.push('watcher'); throw Error('watcher close failed'); } };
    ProjectManager.instance = { destroyAll: () => events.push('projects') };
    FilesManager.instance = { onShutdown: async () => events.push('files') };

    await assert.rejects(handlers.onShutdown(), /watcher close failed/);
    assert.equal(server.isDown, true);
    assert.deepEqual(events, ['watcher']);

    FilesWatcher.instance.destroy = async () => events.push('watcher retry');
    await handlers.onShutdown();
    assert.deepEqual(events, ['watcher', 'watcher retry', 'projects', 'files']);
});
