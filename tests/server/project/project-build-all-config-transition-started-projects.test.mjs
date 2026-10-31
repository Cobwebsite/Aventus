import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }, { ProjectManager }, { Build }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/ProjectManager.ts', 'project/Build.ts',
    'settings/Settings.ts', 'GenericServer.ts', 'files/FilesManager.ts',
    'project/DependencyManager.ts', 'Mutex.ts',
]);

test('global build keeps its started projects while one configuration replaces a build', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-all-transition-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        init: Build.prototype.init, build: Build.prototype.build, destroy: Build.prototype.destroy,
    };
    SettingsManager.instance = { settings: { defaultHideWarnings: false, watchFiles: false, useStats: false },
        settingsHtml: { customData: [] }, onSettingsChange: () => 'settings', onSettingsChangeHtml: () => 'html' };
    GenericServer.instance = { workspaces: [pathToFileURL(root).href], logLevel: 0, isIDE: false,
        _extensionPath: join(import.meta.dirname, '..', '..'), connection: { sendNotification: () => {} } };
    FilesManager.instance = { onNewFile: () => 'subscription', removeOnNewFile: () => {} };
    DependencyManager.instance = { getPath: () => root };
    const events = [];
    let releaseOld;
    const oldBuildGate = new Promise(resolve => { releaseOld = resolve; });
    Build.prototype.init = async function () { events.push(`init:${this.fullname}`); };
    Build.prototype.build = async function () {
        events.push(`build:${this.fullname}`);
        if (this.fullname === 'First@old') await oldBuildGate;
        events.push(`built:${this.fullname}`);
    };
    Build.prototype.destroy = function () { events.push(`destroy:${this.fullname}`); };
    t.after(() => {
        releaseOld();
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        Build.prototype.init = previous.init;
        Build.prototype.build = previous.build;
        Build.prototype.destroy = previous.destroy;
    });

    const createProject = async (module, name) => {
        const uri = pathToFileURL(join(root, module, 'aventus.conf.avt')).href;
        const configFile = { uri, path: join(root, module, 'aventus.conf.avt'),
            documentUser: TextDocument.create(uri, 'json', 1,
                JSON.stringify({ module, build: [{ name, src: [] }] })) };
        const project = Object.create(Project.prototype);
        Object.assign(project, { configFile, config: null, builds: [], statics: [], scssFiles: {},
            onConfigSaveMutex: new Mutex() });
        await project.onConfigSave();
        return project;
    };
    const first = await createProject('First', 'old');
    const second = await createProject('Second', 'steady');
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = { first, second };

    const running = manager.buildAll();
    assert.equal(events.filter(event => event === 'build:First@old').length, 1);
    assert.equal(events.filter(event => event === 'build:Second@steady').length, 1);
    assert.ok(!events.includes('built:First@old'));
    first.configFile.documentUser = TextDocument.create(first.configFile.uri, 'json', 2,
        JSON.stringify({ module: 'First', build: [{ name: 'new', src: [] }] }));
    await first.onConfigSave();
    assert.deepEqual(first.getBuildsName(), ['First@new']);
    assert.deepEqual(second.getBuildsName(), ['Second@steady']);
    assert.ok(events.includes('destroy:First@old'));
    assert.ok(!events.includes('destroy:Second@steady'));

    const rerun = manager.buildAll();
    await rerun;
    assert.equal(events.filter(event => event === 'build:First@old').length, 1);
    assert.equal(events.filter(event => event === 'build:First@new').length, 1);
    assert.equal(events.filter(event => event === 'build:Second@steady').length, 2);
    releaseOld();
    await running;
    assert.equal(events.filter(event => event === 'built:First@old').length, 1);
});
