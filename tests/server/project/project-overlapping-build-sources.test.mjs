import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }, { ProjectManager }, { Build }, { SettingsManager },
    { GenericServer }, { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/ProjectManager.ts', 'project/Build.ts',
    'settings/Settings.ts', 'GenericServer.ts', 'files/FilesManager.ts',
    'project/DependencyManager.ts', 'Mutex.ts',
]);

test('overlapping build sources retain every owner while neighboring and retired paths stay excluded', async t => {
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        init: Build.prototype.init, destroy: Build.prototype.destroy,
    };
    SettingsManager.instance = {
        settings: { defaultHideWarnings: false, watchFiles: false, useStats: false },
        settingsHtml: { customData: [] }, onSettingsChange: () => 'settings',
        onSettingsChangeHtml: () => 'html',
    };
    GenericServer.instance = {
        workspaces: ['file:///D:/round199'], logLevel: 0, isIDE: false,
        _extensionPath: join(import.meta.dirname, '..', '..'),
        connection: { sendNotification() {} },
    };
    FilesManager.instance = { onNewFile: () => 'subscription', removeOnNewFile() {} };
    DependencyManager.instance = { getPath: () => import.meta.dirname };
    Build.prototype.init = async function () { this.initDone = true; };
    Build.prototype.destroy = function () {};
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        Build.prototype.init = previous.init;
        Build.prototype.destroy = previous.destroy;
    });

    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};
    const projects = new Map();
    for (const name of ['alpha', 'beta']) {
        const uri = `file:///D:/round199/${name}/aventus.conf.avt`;
        const configFile = { uri, path: `D:/round199/${name}/aventus.conf.avt` };
        const project = Object.create(Project.prototype);
        Object.assign(project, { configFile, config: null, builds: [], statics: [], scssFiles: {},
            onConfigSaveMutex: new Mutex() });
        manager.projects[uri] = project;
        projects.set(name, project);
    }
    const save = async (name, version, builds) => {
        const project = projects.get(name);
        const { configFile } = project;
        configFile.documentUser = TextDocument.create(configFile.uri, 'json', version,
            JSON.stringify({ module: name, build: builds }));
        await project.onConfigSave();
    };
    const owners = path => manager.getMatchingBuildsByUri(`file:///D:/round199/${path}`)
        .map(build => build.fullname);

    await save('alpha', 1, [
        { name: 'all', src: ['./src'] },
        { name: 'nested', src: ['./src/nested'] },
        { name: 'exact', src: ['./src/nested/entry.lib.avt'] },
    ]);
    await save('beta', 1, [{ name: 'shared', src: ['../alpha/src/nested'] }]);
    assert.deepEqual(owners('alpha/src/nested/entry.lib.avt'),
        ['alpha@all', 'alpha@nested', 'alpha@exact', 'beta@shared']);
    assert.deepEqual(owners('alpha/src/nested/other.lib.avt'),
        ['alpha@all', 'alpha@nested', 'beta@shared']);
    assert.deepEqual(owners('alpha/src/neighbor.lib.avt'), ['alpha@all']);
    assert.deepEqual(owners('alpha/src-neighbor/nested/entry.lib.avt'), []);
    assert.deepEqual(owners('alpha/src/nested-neighbor/entry.lib.avt'), ['alpha@all']);
    assert.deepEqual(owners('alpha/src/nested/entry.lib.avt.bak'),
        ['alpha@all', 'alpha@nested', 'beta@shared']);

    await save('alpha', 2, [
        { name: 'all', src: ['./next'] },
        { name: 'nested', src: ['./src/nested'] },
        { name: 'exact', src: ['./src/nested/replacement.lib.avt'] },
    ]);
    assert.deepEqual(owners('alpha/src/nested/entry.lib.avt'), ['alpha@nested', 'beta@shared']);
    assert.deepEqual(owners('alpha/src/nested/replacement.lib.avt'),
        ['alpha@nested', 'alpha@exact', 'beta@shared']);
    assert.deepEqual(owners('alpha/src/neighbor.lib.avt'), []);
    assert.deepEqual(owners('alpha/next/neighbor.lib.avt'), ['alpha@all']);
    assert.deepEqual(owners('alpha/next-neighbor/neighbor.lib.avt'), []);
});
