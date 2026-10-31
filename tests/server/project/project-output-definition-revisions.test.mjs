import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }, { Build }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'files/FilesManager.ts', 'project/DependencyManager.ts', 'Mutex.ts',
]);

test('component definitions follow package output revisions and invalid config recovery', async t => {
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        init: Build.prototype.init, destroy: Build.prototype.destroy,
        definition: Build.prototype.getLocalWebComponentDefinition,
    };
    const destroyed = [];
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
    DependencyManager.instance = { getPath: () => '/workspace/dependencies' };
    Build.prototype.init = async function () {};
    Build.prototype.destroy = function () { destroyed.push(this); };
    Build.prototype.getLocalWebComponentDefinition = function (tag) {
        return tag === `x-${this.buildConfig.name}` ? { owner: this.buildConfig.name } : undefined;
    };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        Build.prototype.init = previous.init;
        Build.prototype.destroy = previous.destroy;
        Build.prototype.getLocalWebComponentDefinition = previous.definition;
    });

    const uri = 'file:///workspace/demo/aventus.conf.avt';
    const file = { uri, path: '/workspace/demo/aventus.conf.avt' };
    const project = Object.create(Project.prototype);
    Object.assign(project, { configFile: file, config: null, builds: [], statics: [],
        scssFiles: {}, onConfigSaveMutex: new Mutex() });
    const save = async (version, build) => {
        file.documentUser = TextDocument.create(uri, 'json', version,
            JSON.stringify({ module: 'Demo', build }));
        await project.onConfigSave();
    };
    const makeBuild = (name, output) => ({ name, src: [], compile: [{ package: output }] });
    const firstPath = 'workspace/demo/dist/first.package.avt';
    const secondPath = 'workspace/demo/dist/second.package.avt';
    const thirdPath = 'workspace/demo/dist/third.package.avt';

    await save(1, [makeBuild('alpha', './dist/first.package.avt'),
        makeBuild('beta', './dist/second.package.avt')]);
    const initial = [...project.getBuilds()];
    assert.ok(initial[0].outputPathes.includes(firstPath), JSON.stringify(initial[0].outputPathes));
    assert.deepEqual(project.getBuildsName(), ['Demo@alpha', 'Demo@beta']);
    assert.deepEqual(project.getInternalWebComponentDefinition(firstPath, 'x-alpha'), { owner: 'alpha' });
    assert.deepEqual(project.getInternalWebComponentDefinition(secondPath, 'x-beta'), { owner: 'beta' });
    assert.equal(project.getInternalWebComponentDefinition(firstPath, 'x-beta'), undefined);

    await save(2, [makeBuild('alpha', './dist/second.package.avt'),
        makeBuild('beta', './dist/third.package.avt')]);
    const revised = [...project.getBuilds()];
    assert.deepEqual(destroyed, initial);
    assert.equal(project.getInternalWebComponentDefinition(firstPath, 'x-alpha'), undefined);
    assert.deepEqual(project.getInternalWebComponentDefinition(secondPath, 'x-alpha'), { owner: 'alpha' });
    assert.deepEqual(project.getInternalWebComponentDefinition(thirdPath, 'x-beta'), { owner: 'beta' });
    assert.equal(project.getInternalWebComponentDefinition(secondPath, 'x-beta'), undefined);

    file.documentUser = TextDocument.create(uri, 'json', 3, '{ invalid');
    await project.onConfigSave();
    assert.deepEqual(project.getBuilds(), []);
    assert.deepEqual(destroyed, [...initial, ...revised]);
    assert.equal(project.getInternalWebComponentDefinition(secondPath, 'x-alpha'), undefined);
    assert.equal(project.getInternalWebComponentDefinition(thirdPath, 'x-beta'), undefined);

    await save(4, [makeBuild('beta', './dist/first.package.avt')]);
    assert.deepEqual(project.getBuildsName(), ['Demo@beta']);
    assert.deepEqual(project.getInternalWebComponentDefinition(firstPath, 'x-beta'), { owner: 'beta' });
    assert.equal(project.getInternalWebComponentDefinition(secondPath, 'x-alpha'), undefined);
    assert.equal(project.getInternalWebComponentDefinition(thirdPath, 'x-beta'), undefined);
});
