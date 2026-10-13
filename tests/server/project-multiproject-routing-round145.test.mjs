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

test('two projects sharing a source reroute independently after invalidation and recovery', async t => {
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
        workspaces: ['file:///D:/round145'], logLevel: 0, isIDE: false,
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

    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};
    const makeProject = name => {
        const uri = `file:///D:/round145/${name}/aventus.conf.avt`;
        const configFile = { uri, path: `D:/round145/${name}/aventus.conf.avt` };
        const project = Object.create(Project.prototype);
        Object.assign(project, { configFile, config: null, builds: [], statics: [],
            scssFiles: {}, onConfigSaveMutex: new Mutex() });
        manager.projects[uri] = project;
        return { project, configFile, uri };
    };
    const alpha = makeProject('alpha');
    const beta = makeProject('beta');
    const save = async (entry, version, value) => {
        entry.configFile.documentUser = TextDocument.create(entry.uri, 'json', version,
            typeof value === 'string' ? value : JSON.stringify(value));
        await entry.project.onConfigSave();
    };
    const owners = path => manager.getMatchingBuildsByUri(`file:///D:/round145/${path}`)
        .map(build => build.fullname);

    await save(alpha, 1, { module: 'Alpha', build: [{ name: 'web', src: ['../shared'] }] });
    await save(beta, 1, { module: 'Beta', build: [{ name: 'web', src: ['../shared'] }] });
    const oldAlpha = alpha.project.getBuilds()[0];
    const oldBeta = beta.project.getBuilds()[0];
    assert.deepEqual(owners('shared/view.wc.avt'), ['Alpha@web', 'Beta@web']);

    await save(alpha, 2, '{ invalid');
    assert.deepEqual(owners('shared/view.wc.avt'), ['Beta@web']);
    assert.ok(destroyed.includes(oldAlpha));
    assert.ok(!destroyed.includes(oldBeta));

    await save(alpha, 3, { module: 'Alpha', build: [{ name: 'web', src: ['../alpha-only'] }] });
    assert.deepEqual(owners('shared/view.wc.avt'), ['Beta@web']);
    assert.deepEqual(owners('alpha-only/view.wc.avt'), ['Alpha@web']);

    await save(beta, 2, { module: 'Beta', build: [{ name: 'web', src: ['../beta-only'] }] });
    assert.deepEqual(owners('shared/view.wc.avt'), []);
    assert.deepEqual(owners('alpha-only/view.wc.avt'), ['Alpha@web']);
    assert.deepEqual(owners('beta-only/view.wc.avt'), ['Beta@web']);
});
