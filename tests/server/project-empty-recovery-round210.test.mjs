import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { Build }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'files/FilesManager.ts', 'project/DependencyManager.ts', 'Mutex.ts',
]);

test('project recovers from invalid initial config and from an empty build list', async t => {
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        init: Build.prototype.init, destroy: Build.prototype.destroy,
    };
    const started = [], destroyed = [];
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
    FilesManager.instance = { onNewFile: () => 'subscription', removeOnNewFile: () => {} };
    DependencyManager.instance = { getPath: () => import.meta.dirname };
    Build.prototype.init = async function () { started.push(this); };
    Build.prototype.destroy = function () { destroyed.push(this); };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        Build.prototype.init = previous.init;
        Build.prototype.destroy = previous.destroy;
    });

    const uri = 'file:///workspace/demo/aventus.conf.avt';
    const file = { uri, path: '/workspace/demo/aventus.conf.avt' };
    const project = Object.create(Project.prototype);
    Object.assign(project, { configFile: file, config: null, builds: [], statics: [],
        scssFiles: {}, onConfigSaveMutex: new Mutex() });
    const save = async (version, content) => {
        file.documentUser = TextDocument.create(uri, 'json', version, content);
        await project.onConfigSave();
    };

    await save(1, '{ invalid');
    assert.equal(project.getConfig(), null);
    assert.deepEqual(project.getBuilds(), []);
    assert.deepEqual(started, []);

    await save(2, JSON.stringify({ module: 'Demo', build: [
        { name: 'alpha', src: [] }, { name: 'beta', src: [] },
    ] }));
    assert.deepEqual(project.getBuildsName(), ['Demo@alpha', 'Demo@beta']);
    const first = [...project.getBuilds()];
    assert.deepEqual(started, first);

    await save(3, JSON.stringify({ module: 'Demo', build: [] }));
    assert.deepEqual(project.getBuildsName(), []);
    assert.deepEqual(destroyed, first);

    await save(4, JSON.stringify({ module: 'Demo', build: [{ name: 'beta', src: [] }] }));
    assert.deepEqual(project.getBuildsName(), ['Demo@beta']);
    assert.equal(started.length, 3);
    assert.notEqual(project.getBuilds()[0], first[1]);
    assert.deepEqual(destroyed, first);
});
