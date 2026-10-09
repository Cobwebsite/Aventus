import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { SettingsManager }, { GenericServer }, { FilesManager }] = await loadServerModules([
    'project/Project.ts', 'settings/Settings.ts', 'GenericServer.ts', 'files/FilesManager.ts',
]);
SettingsManager.instance = { settings: { defaultHideWarnings: false } };
GenericServer.instance = { workspaces: ['file:///D:/app'], logLevel: 4 };

function project(value) {
    const instance = Object.create(Project.prototype);
    instance.configFile = {
        documentUser: TextDocument.create('file:///D:/app/aventus.conf.avt', 'json', 1, JSON.stringify(value)),
    };
    instance.config = null;
    instance.builds = [];
    instance.statics = [];
    return instance;
}

test('project loads a valid configuration and retains builds when it is unchanged', async () => {
    const instance = project({ module: 'Demo', build: [{ src: [] }] });
    await instance.loadConfig();
    assert.equal(instance.getConfig().module, 'Demo');
    const config = instance.getConfig();
    const destroyed = [];
    instance.builds = [{ destroy: () => destroyed.push('build') }];
    await instance.loadConfig();
    assert.equal(instance.getConfig(), config);
    assert.equal(instance.builds.length, 1);
    assert.deepEqual(destroyed, []);
});

test('project replaces builds when configuration changes or becomes invalid', async () => {
    const instance = project({ module: 'Demo', build: [{ src: [] }] });
    await instance.loadConfig();
    const destroyed = [];
    instance.builds = [{ destroy: () => destroyed.push('old') }];
    instance.configFile.documentUser = TextDocument.create('file:///D:/app/aventus.conf.avt', 'json', 2, JSON.stringify({ module: 'NewDemo', build: [{ src: [] }] }));
    await instance.loadConfig();
    assert.equal(instance.getConfig().module, 'NewDemo');
    assert.deepEqual(instance.builds, []);
    assert.deepEqual(destroyed, ['old']);

    instance.builds = [{ destroy: () => destroyed.push('new') }];
    instance.configFile.documentUser = TextDocument.create('file:///D:/app/aventus.conf.avt', 'json', 3, '{ bad json');
    await instance.loadConfig();
    assert.equal(instance.getConfig(), null);
    assert.deepEqual(instance.builds, []);
    assert.deepEqual(destroyed, ['old', 'new']);
});

test('project destroy unregisters configuration callbacks and output resources', () => {
    const instance = project({ module: 'Demo', build: [{ src: [] }] });
    const removed = [];
    const file = instance.configFile;
    for (const name of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        instance[`on${name}UUID`] = name;
        file[`removeOn${name}`] = value => removed.push([name, value]);
    }
    instance.onNewFileUUID = 'new-file';
    instance.builds = [{ destroy: () => removed.push(['build']) }];
    instance.statics = [{ destroy: () => removed.push(['static']) }];
    FilesManager.instance = { removeOnNewFile: value => removed.push(['new-file', value]) };
    instance.destroy();
    assert.deepEqual(removed, [
        ['new-file', 'new-file'], ['Save', 'Save'], ['Validate', 'Validate'],
        ['Formatting', 'Formatting'], ['Completion', 'Completion'],
        ['CompletionResolve', 'CompletionResolve'], ['Hover', 'Hover'],
        ['build'], ['static'],
    ]);
});
