import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { Build }, { SettingsManager }, { GenericServer }, { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'files/FilesManager.ts', 'project/DependencyManager.ts', 'Mutex.ts',
]);

test('saving unchanged project configuration retains destroyed builds beside replacement builds', async t => {
    const previous = {
        settings: SettingsManager.instance,
        server: GenericServer.instance,
        files: FilesManager.instance,
        dependency: DependencyManager.instance,
        init: Build.prototype.init,
        destroy: Build.prototype.destroy,
    };
    const events = [];
    SettingsManager.instance = {
        settings: { defaultHideWarnings: false, watchFiles: false, useStats: false },
        settingsHtml: { customData: [] },
        onSettingsChange: () => 'settings', onSettingsChangeHtml: () => 'html',
    };
    GenericServer.instance = {
        workspaces: ['file:///D:/project'], logLevel: 0, isIDE: false,
        _extensionPath: join(import.meta.dirname, '..', '..'),
        connection: { sendNotification: () => {} },
    };
    FilesManager.instance = { onNewFile: () => 'subscription', removeOnNewFile: () => {} };
    DependencyManager.instance = { getPath: () => import.meta.dirname };
    Build.prototype.init = async function () { events.push(['init', this.fullname]); };
    Build.prototype.destroy = function () { events.push(['destroy', this.fullname]); };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        Build.prototype.init = previous.init;
        Build.prototype.destroy = previous.destroy;
    });

    const uri = 'file:///D:/project/aventus.conf.avt';
    const content = JSON.stringify({ module: 'Demo', build: [{ name: 'web', src: [] }] });
    const configFile = { uri, path: 'D:/project/aventus.conf.avt', documentUser: TextDocument.create(uri, 'json', 1, content) };
    const project = Object.create(Project.prototype);
    Object.assign(project, { configFile, config: null, builds: [], statics: [], scssFiles: {}, onConfigSaveMutex: new Mutex() });

    await project.onConfigSave();
    assert.deepEqual(project.getBuildsName(), ['Demo@web']);
    const first = project.getBuilds()[0];

    configFile.documentUser = TextDocument.create(uri, 'json', 2, content);
    await project.onConfigSave();
    assert.equal(project.getConfig().module, 'Demo');
    assert.deepEqual(project.getBuildsName(), ['Demo@web', 'Demo@web']);
    assert.equal(project.getBuilds()[0], first);
    assert.notEqual(project.getBuilds()[1], first);
    assert.deepEqual(events, [
        ['init', 'Demo@web'], ['destroy', 'Demo@web'], ['init', 'Demo@web'],
    ]);

    configFile.documentUser = TextDocument.create(uri, 'json', 3, '{ invalid');
    await project.onConfigSave();
    assert.equal(project.getConfig(), null);
    assert.deepEqual(project.getBuildsName(), []);
    assert.deepEqual(events.slice(3), [['destroy', 'Demo@web'], ['destroy', 'Demo@web']]);
});
