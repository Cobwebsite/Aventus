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

test('project routing follows source changes, invalidation and recovery across builds', async t => {
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        init: Build.prototype.init, destroy: Build.prototype.destroy,
    };
    SettingsManager.instance = {
        settings: { defaultHideWarnings: false, watchFiles: false, useStats: false },
        settingsHtml: { customData: [] },
        onSettingsChange: () => 'settings', onSettingsChangeHtml: () => 'html',
    };
    GenericServer.instance = {
        workspaces: ['file:///D:/round138'], logLevel: 0, isIDE: false,
        _extensionPath: join(import.meta.dirname, '..', '..'),
        connection: { sendNotification: () => {} },
    };
    FilesManager.instance = { onNewFile: () => 'subscription', removeOnNewFile: () => {} };
    DependencyManager.instance = { getPath: () => import.meta.dirname };
    const destroyed = [];
    Build.prototype.init = async function () { this.initDone = true; };
    Build.prototype.destroy = function () { destroyed.push(this); };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        Build.prototype.init = previous.init;
        Build.prototype.destroy = previous.destroy;
    });

    const uri = 'file:///D:/round138/aventus.conf.avt';
    const configFile = { uri, path: 'D:/round138/aventus.conf.avt' };
    const project = Object.create(Project.prototype);
    Object.assign(project, { configFile, config: null, builds: [], statics: [], scssFiles: {},
        onConfigSaveMutex: new Mutex() });
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = { [uri]: project };
    const owners = path => manager.getMatchingBuildsByUri(`file:///D:/round138/${path}`)
        .map(build => build.fullname);
    const save = async (version, value) => {
        configFile.documentUser = TextDocument.create(uri, 'json', version,
            typeof value === 'string' ? value : JSON.stringify(value));
        await project.onConfigSave();
    };

    await save(1, { module: 'Demo', build: [
        { name: 'web', src: ['./web'] },
        { name: 'shared', src: ['./shared'] },
    ] });
    const initial = project.getBuilds();
    assert.deepEqual(owners('web/entry.lib.avt'), ['Demo@web']);
    assert.deepEqual(owners('web-extra/entry.lib.avt'), []);
    assert.deepEqual(owners('shared/entry.lib.avt'), ['Demo@shared']);

    await save(2, { module: 'Demo', build: [
        { name: 'web', src: ['./client', './shared'] },
        { name: 'shared', src: ['./shared'] },
    ] });
    assert.deepEqual(owners('web/entry.lib.avt'), []);
    assert.deepEqual(owners('client/entry.lib.avt'), ['Demo@web']);
    assert.deepEqual(owners('client-extra/entry.lib.avt'), []);
    assert.deepEqual(owners('shared/entry.lib.avt'), ['Demo@web', 'Demo@shared']);
    assert.ok(initial.every(build => destroyed.includes(build)));

    await save(3, '{ invalid');
    assert.deepEqual(owners('client/entry.lib.avt'), []);
    assert.deepEqual(owners('shared/entry.lib.avt'), []);

    await save(4, { module: 'Demo', build: [{ name: 'web', src: ['./web'] }] });
    assert.deepEqual(owners('web/entry.lib.avt'), ['Demo@web']);
    assert.deepEqual(owners('client/entry.lib.avt'), []);
    assert.deepEqual(owners('shared/entry.lib.avt'), []);
});
