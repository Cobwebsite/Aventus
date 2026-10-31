import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ProjectManager }, { FilesManager }, { SettingsManager }, { GenericServer },
    { Build }, { DependencyManager }] = await loadServerModules([
    'project/ProjectManager.ts', 'files/FilesManager.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'project/Build.ts', 'project/DependencyManager.ts',
]);

test('a template sibling suppresses a config project until the config is rediscovered without it', async t => {
    const before = {
        files: FilesManager.instance, settings: SettingsManager.instance,
        server: GenericServer.instance, dependency: DependencyManager.instance,
        autoLoad: ProjectManager.autoLoad, init: Build.prototype.init,
    };
    const configUri = 'file:///workspace/aventus.conf.avt';
    const templateUri = 'file:///workspace/template.avt.ts';
    let templatePresent = true;
    const subscriptions = new Set();
    let nextId = 0;
    FilesManager.instance = {
        getByUri: uri => uri === templateUri && templatePresent ? { uri } : undefined,
        onNewFile: () => { const id = `new-${++nextId}`; subscriptions.add(id); return id; },
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
        FilesManager.instance = before.files;
        SettingsManager.instance = before.settings;
        GenericServer.instance = before.server;
        DependencyManager.instance = before.dependency;
        ProjectManager.autoLoad = before.autoLoad;
        Build.prototype.init = before.init;
    });

    const file = {
        uri: configUri, path: '/workspace/aventus.conf.avt', folderUri: 'file:///workspace',
        documentUser: TextDocument.create(configUri, 'json', 1,
            JSON.stringify({ module: 'Demo', build: [{ name: 'web', src: [] }] })),
        validate: () => {},
    };
    for (const event of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover', 'Delete']) {
        file[`on${event}`] = () => event;
        file[`removeOn${event}`] = () => {};
    }
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};

    await manager.onNewFile(file);
    assert.equal(manager.getProjectByUri(configUri), undefined);
    assert.deepEqual(manager.getAllBuilds(), []);
    assert.equal(subscriptions.size, 0);

    templatePresent = false;
    await manager.onNewFile(file);
    const project = manager.getProjectByUri(configUri);
    assert.ok(project);
    await project.init();
    assert.deepEqual(manager.getAllBuilds(), [{ name: 'Demo@web', uri: configUri }]);
    assert.equal(subscriptions.size, 2);
    project.destroy();
    assert.equal(subscriptions.size, 0);
});
