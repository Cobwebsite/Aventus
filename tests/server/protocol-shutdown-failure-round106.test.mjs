import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GenericServer }, { SettingsManager }, { FilesWatcher }, { FilesManager }, { ProjectManager }] = await loadServerModules([
    'GenericServer.ts', 'settings/Settings.ts', 'files/FilesWatcher.ts',
    'files/FilesManager.ts', 'project/ProjectManager.ts',
]);

test('watcher cleanup failure still allows project and file cleanup', async t => {
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

    const errors = await server.onShutdown();
    assert.deepEqual(errors.map(item => item.message), ['FilesWatcher: Error: watcher close failed']);
    assert.equal(server.isDown, true);
    assert.deepEqual(events, ['watcher', 'projects', 'files']);

    FilesWatcher.instance.destroy = async () => events.push('watcher retry');
    assert.deepEqual(await server.onShutdown(), []);
    assert.deepEqual(events, ['watcher', 'projects', 'files', 'watcher retry', 'projects', 'files']);
});

test('shutdown reports all cleanup failures after attempting every resource', async t => {
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
    FilesWatcher.instance = { destroy: async () => { events.push('watcher'); throw Error('watcher failed'); } };
    ProjectManager.instance = { destroyAll: () => { events.push('projects'); throw Error('projects failed'); } };
    FilesManager.instance = { onShutdown: async () => { events.push('files'); throw Error('files failed'); } };

    const errors = await server.onShutdown();
    assert.deepEqual(errors.map(item => item.message), [
        'FilesWatcher: Error: watcher failed',
        'ProjectManager: Error: projects failed',
        'FilesManager: Error: files failed',
    ]);
    assert.deepEqual(events, ['watcher', 'projects', 'files']);
});
