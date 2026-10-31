import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ProjectManager }, { FilesManager }, { Build }, { SettingsManager },
    { GenericServer }, { DependencyManager }] = await loadServerModules([
    'project/ProjectManager.ts', 'files/FilesManager.ts', 'project/Build.ts',
    'settings/Settings.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
]);

test('config save followed by deletion and rediscovery replaces only the current project builds', async t => {
    const previous = {
        files: FilesManager.instance, settings: SettingsManager.instance,
        server: GenericServer.instance, dependency: DependencyManager.instance,
        autoLoad: ProjectManager.autoLoad, init: Build.prototype.init,
        destroy: Build.prototype.destroy,
    };
    const subscriptions = new Set();
    let next = 0;
    FilesManager.instance = {
        getByUri: () => undefined,
        onNewFile: () => { const id = ++next; subscriptions.add(id); return id; },
        removeOnNewFile: id => subscriptions.delete(id),
    };
    SettingsManager.instance = {
        settings: { defaultHideWarnings: false, watchFiles: false, useStats: false },
        settingsHtml: { customData: [] }, onSettingsChange: () => 'settings',
        onSettingsChangeHtml: () => 'html',
    };
    GenericServer.instance = {
        workspaces: ['file:///workspace'], logLevel: 99, isIDE: false,
        _extensionPath: join(import.meta.dirname, '..', '..'),
        connection: { sendNotification: () => {} },
    };
    DependencyManager.instance = { getPath: () => join(import.meta.dirname, '..', '..') };
    ProjectManager.autoLoad = false;
    const started = [], destroyed = [];
    Build.prototype.init = async function () { started.push(this); };
    Build.prototype.destroy = function () {
        destroyed.push(this);
        return previous.destroy.call(this);
    };
    t.after(() => {
        FilesManager.instance = previous.files;
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        DependencyManager.instance = previous.dependency;
        ProjectManager.autoLoad = previous.autoLoad;
        Build.prototype.init = previous.init;
        Build.prototype.destroy = previous.destroy;
    });

    const uri = 'file:///workspace/demo/aventus.conf.avt';
    const callbacks = new Map();
    const file = {
        uri, path: '/workspace/demo/aventus.conf.avt', folderUri: 'file:///workspace/demo',
        validate: () => {},
    };
    for (const event of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover', 'Delete']) {
        file[`on${event}`] = callback => { callbacks.set(event, callback); return event; };
        file[`removeOn${event}`] = () => callbacks.delete(event);
    }
    const setConfig = (version, names) => {
        file.documentUser = TextDocument.create(uri, 'json', version,
            JSON.stringify({ module: 'Demo', build: names.map(name => ({ name, src: [] })) }));
    };
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};

    setConfig(1, ['first']);
    await manager.onNewFile(file);
    const original = manager.getProjectByUri(uri);
    await original.init();
    const first = original.getBuilds()[0];
    assert.deepEqual(manager.getAllBuilds(), [{ name: 'Demo@first', uri }]);

    setConfig(2, ['second', 'third']);
    await callbacks.get('Save')();
    assert.deepEqual(manager.getAllBuilds(), [
        { name: 'Demo@second', uri }, { name: 'Demo@third', uri },
    ]);
    assert.ok(destroyed.includes(first));
    const oldBuilds = original.getBuilds();
    await callbacks.get('Delete')(file);
    assert.equal(manager.getProjectByUri(uri), undefined);
    assert.deepEqual(manager.getAllBuilds(), []);
    assert.ok(oldBuilds.every(build => destroyed.includes(build)));
    assert.equal(subscriptions.size, 0);

    setConfig(3, ['fourth']);
    await manager.onNewFile(file);
    const recreated = manager.getProjectByUri(uri);
    assert.notEqual(recreated, original);
    await recreated.init();
    assert.deepEqual(manager.getAllBuilds(), [{ name: 'Demo@fourth', uri }]);
    assert.equal(subscriptions.size, 2);
    assert.equal(started.length, 4);
    await callbacks.get('Delete')(file);
    assert.equal(subscriptions.size, 0);
});
