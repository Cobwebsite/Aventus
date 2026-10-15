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

test('same-named projects remain distinct through deletion and recreation of one config', async t => {
    const previous = {
        files: FilesManager.instance, settings: SettingsManager.instance,
        server: GenericServer.instance, dependency: DependencyManager.instance,
        autoLoad: ProjectManager.autoLoad, init: Build.prototype.init,
    };
    const subscriptions = new Set();
    let sequence = 0;
    FilesManager.instance = {
        getByUri: () => undefined,
        onNewFile: () => { const id = ++sequence; subscriptions.add(id); return id; },
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
    Build.prototype.init = async function () { this.initDone = true; };
    t.after(() => {
        FilesManager.instance = previous.files;
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        DependencyManager.instance = previous.dependency;
        ProjectManager.autoLoad = previous.autoLoad;
        Build.prototype.init = previous.init;
    });

    const makeFile = folder => {
        const uri = `file:///workspace/${folder}/aventus.conf.avt`;
        const events = new Map();
        const file = {
            uri, path: `/workspace/${folder}/aventus.conf.avt`, folderUri: `file:///workspace/${folder}`,
            documentUser: TextDocument.create(uri, 'json', 1,
                JSON.stringify({ module: 'Shared', build: [{ name: 'web', src: [] }] })),
            validate: () => {},
        };
        for (const event of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover', 'Delete']) {
            file[`on${event}`] = callback => { events.set(event, callback); return `${folder}-${event}`; };
            file[`removeOn${event}`] = () => { if (event !== 'Delete') events.delete(event); };
        }
        return { file, events };
    };
    const alpha = makeFile('alpha');
    const beta = makeFile('beta');
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};

    await manager.onNewFile(alpha.file);
    await manager.onNewFile(beta.file);
    const firstAlpha = manager.getProjectByUri(alpha.file.uri);
    const firstBeta = manager.getProjectByUri(beta.file.uri);
    assert.ok(firstAlpha instanceof Project);
    assert.ok(firstBeta instanceof Project);
    await Promise.all([firstAlpha.init(), firstBeta.init()]);
    assert.deepEqual(manager.getAllConfigFiles(), [alpha.file.uri, beta.file.uri]);
    assert.deepEqual(manager.getAllBuilds(), [
        { name: 'Shared@web', uri: alpha.file.uri },
        { name: 'Shared@web', uri: beta.file.uri },
    ]);
    assert.equal(subscriptions.size, 4);

    await alpha.events.get('Delete')(alpha.file);
    assert.equal(manager.getProjectByUri(alpha.file.uri), undefined);
    assert.equal(manager.getProjectByUri(beta.file.uri), firstBeta);
    assert.deepEqual(manager.getAllConfigFiles(), [beta.file.uri]);
    assert.deepEqual(manager.getAllBuilds(), [{ name: 'Shared@web', uri: beta.file.uri }]);
    assert.equal(subscriptions.size, 2);

    alpha.file.documentUser = TextDocument.create(alpha.file.uri, 'json', 2,
        JSON.stringify({ module: 'Renewed', build: [{ name: 'mobile', src: [] }] }));
    await manager.onNewFile(alpha.file);
    const secondAlpha = manager.getProjectByUri(alpha.file.uri);
    assert.ok(secondAlpha instanceof Project);
    assert.notEqual(secondAlpha, firstAlpha);
    await secondAlpha.init();
    assert.equal(manager.getProjectByUri(beta.file.uri), firstBeta);
    assert.deepEqual(manager.getAllConfigFiles(), [beta.file.uri, alpha.file.uri]);
    assert.deepEqual(manager.getAllBuilds(), [
        { name: 'Shared@web', uri: beta.file.uri },
        { name: 'Renewed@mobile', uri: alpha.file.uri },
    ]);
    assert.equal(subscriptions.size, 4);

    await alpha.events.get('Delete')(alpha.file);
    await beta.events.get('Delete')(beta.file);
    assert.deepEqual(manager.getAllConfigFiles(), []);
    assert.equal(subscriptions.size, 0);
});
