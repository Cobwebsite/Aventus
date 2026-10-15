import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { ProjectManager }, { Build }, { SettingsManager },
    { GenericServer }, { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/ProjectManager.ts', 'project/Build.ts',
    'settings/Settings.ts', 'GenericServer.ts', 'files/FilesManager.ts',
    'project/DependencyManager.ts', 'Mutex.ts',
]);

test('exact-file source routing follows revisions in one project without changing a second project', async t => {
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        init: Build.prototype.init,
    };
    SettingsManager.instance = {
        settings: { defaultHideWarnings: false, watchFiles: false, useStats: false },
        settingsHtml: { customData: [] },
        onSettingsChange: () => 'settings', onSettingsChangeHtml: () => 'html',
    };
    GenericServer.instance = {
        workspaces: ['file:///D:/round169'], logLevel: 0, isIDE: false,
        _extensionPath: join(import.meta.dirname, '..', '..'),
        connection: { sendNotification: () => {} },
    };
    FilesManager.instance = { onNewFile: () => 'subscription', removeOnNewFile: () => {} };
    DependencyManager.instance = { getPath: () => import.meta.dirname };
    Build.prototype.init = async function () { this.initDone = true; };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        Build.prototype.init = previous.init;
    });

    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};
    const projects = new Map();
    for (const name of ['alpha', 'beta']) {
        const uri = `file:///D:/round169/${name}/aventus.conf.avt`;
        const configFile = { uri, path: `D:/round169/${name}/aventus.conf.avt` };
        const project = Object.create(Project.prototype);
        Object.assign(project, { configFile, config: null, builds: [], statics: [], scssFiles: {},
            onConfigSaveMutex: new Mutex() });
        manager.projects[uri] = project;
        projects.set(name, project);
    }
    const save = async (name, version, source) => {
        const project = projects.get(name);
        const { configFile } = project;
        configFile.documentUser = TextDocument.create(configFile.uri, 'json', version,
            JSON.stringify({ module: name, build: [{ name: 'web', src: source }] }));
        await project.onConfigSave();
    };
    const owners = path => manager.getMatchingBuildsByUri(`file:///D:/round169/${path}`)
        .map(build => build.fullname);

    await save('alpha', 1, ['./src/entry.lib.avt']);
    await save('beta', 1, ['../shared']);
    assert.deepEqual(owners('alpha/src/entry.lib.avt'), ['alpha@web']);
    assert.deepEqual(owners('alpha/src/entry.lib.avt.bak'), []);
    assert.deepEqual(owners('alpha/src/other.lib.avt'), []);
    assert.deepEqual(owners('shared/item.lib.avt'), ['beta@web']);

    await save('alpha', 2, ['../shared/entry.lib.avt']);
    assert.deepEqual(owners('alpha/src/entry.lib.avt'), []);
    assert.deepEqual(owners('shared/entry.lib.avt'), ['alpha@web', 'beta@web']);
    assert.deepEqual(owners('shared/other.lib.avt'), ['beta@web']);
    assert.deepEqual(owners('shared/entry.lib.avt.bak'), ['beta@web']);

    await save('alpha', 3, ['./src']);
    assert.deepEqual(owners('alpha/src/entry.lib.avt'), ['alpha@web']);
    assert.deepEqual(owners('alpha/src/other.lib.avt'), ['alpha@web']);
    assert.deepEqual(owners('alpha/src-neighbor/entry.lib.avt'), []);
    assert.deepEqual(owners('shared/entry.lib.avt'), ['beta@web']);
});
