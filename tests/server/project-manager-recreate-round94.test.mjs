import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ProjectManager }, { Project }, { FilesManager }, { Build }, { SettingsManager },
    { GenericServer }, { DependencyManager }] = await loadServerModules([
    'project/ProjectManager.ts', 'project/Project.ts', 'files/FilesManager.ts',
    'project/Build.ts', 'settings/Settings.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
]);

test('deleting and rediscovering a config replaces the project and its build listing', async t => {
    const previous = {
        files: FilesManager.instance, settings: SettingsManager.instance,
        server: GenericServer.instance, dependency: DependencyManager.instance,
        autoLoad: ProjectManager.autoLoad,
        init: Build.prototype.init,
    };
    const subscriptions = new Set();
    let nextId = 0;
    FilesManager.instance = {
        getByUri: () => undefined,
        onNewFile: () => { const id = `new-${++nextId}`; subscriptions.add(id); return id; },
        removeOnNewFile: id => subscriptions.delete(id),
    };
    SettingsManager.instance = { settings: { defaultHideWarnings: false, watchFiles: false, useStats: false },
        settingsHtml: { customData: [] }, onSettingsChange: () => 'settings',
        onSettingsChangeHtml: () => 'html' };
    GenericServer.instance = { workspaces: ['file:///workspace'], logLevel: 99,
        _extensionPath: join(import.meta.dirname, '..', '..'), isIDE: false,
        connection: { sendNotification: () => {} } };
    DependencyManager.instance = { getPath: () => join(import.meta.dirname, '..', '..') };
    ProjectManager.autoLoad = false;
    Build.prototype.init = async function () { this.initDone = true; };
    t.after(() => {
        FilesManager.instance = previous.files;
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        DependencyManager.instance = previous.dependency;
        ProjectManager.autoLoad = previous.autoLoad;
        Build.prototype.init = previous.init;
    });

    const uri = 'file:///workspace/aventus.conf.avt';
    const events = new Map();
    const file = {
        uri, path: '/workspace/aventus.conf.avt', folderUri: 'file:///workspace',
        documentUser: TextDocument.create(uri, 'json', 1, JSON.stringify({ module: 'First', build: [{ name: 'web', src: [] }] })),
        validate: () => {},
    };
    for (const name of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover', 'Delete']) {
        file[`on${name}`] = callback => { events.set(name, callback); return name; };
        file[`removeOn${name}`] = () => { if (name !== 'Delete') events.delete(name); };
    }
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};

    await manager.onNewFile(file);
    const first = manager.getProjectByUri(uri);
    assert.ok(first instanceof Project);
    await first.init();
    assert.deepEqual(manager.getAllBuilds(), [{ name: 'First@web', uri }]);
    assert.equal(subscriptions.size, 2);

    await events.get('Delete')(file);
    assert.equal(manager.getProjectByUri(uri), undefined);
    assert.deepEqual(manager.getAllBuilds(), []);
    assert.equal(subscriptions.size, 0);

    file.documentUser = TextDocument.create(uri, 'json', 2, JSON.stringify({ module: 'Second', build: [{ name: 'mobile', src: [] }] }));
    await manager.onNewFile(file);
    const second = manager.getProjectByUri(uri);
    assert.ok(second instanceof Project);
    assert.notEqual(second, first);
    await second.init();
    assert.deepEqual(manager.getAllBuilds(), [{ name: 'Second@mobile', uri }]);
    second.destroy();
    assert.equal(subscriptions.size, 0);
});
