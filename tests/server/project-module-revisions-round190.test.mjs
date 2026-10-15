import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { Build }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { HttpServer }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'settings/Settings.ts', 'GenericServer.ts',
    'files/FilesManager.ts', 'project/DependencyManager.ts', 'live-server/HttpServer.ts', 'Mutex.ts',
]);

test('module and source revisions replace build choices and routing without stale instances', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.project-module-round190-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const uri = pathToFileURL(join(root, 'aventus.conf.avt')).href;
    const sourceA = pathToFileURL(join(root, 'alpha', 'view.avt')).href;
    const sourceB = pathToFileURL(join(root, 'beta', 'view.avt')).href;
    const neighbor = pathToFileURL(join(root, 'alphabet', 'view.avt')).href;
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        http: HttpServer.getInstance, init: Build.prototype.init,
    };
    const initialized = [];
    SettingsManager.instance = {
        settings: { defaultHideWarnings: false, watchFiles: false, useStats: false },
        settingsHtml: { customData: [] }, onSettingsChange: () => 'settings',
        onSettingsChangeHtml: () => 'html',
    };
    GenericServer.instance = {
        workspaces: [pathToFileURL(root).href], logLevel: 0, isIDE: false,
        _extensionPath: join(import.meta.dirname, '..', '..'),
        connection: { sendNotification: () => {} },
    };
    FilesManager.instance = { onNewFile: () => 'subscription', removeOnNewFile: () => {} };
    DependencyManager.instance = { getPath: () => root };
    HttpServer.getInstance = () => ({ reload: () => {} });
    Build.prototype.init = async function () { initialized.push(this); this.initDone = true; };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        HttpServer.getInstance = previous.http;
        Build.prototype.init = previous.init;
    });

    const configFile = { uri, path: join(root, 'aventus.conf.avt'),
        documentUser: TextDocument.create(uri, 'json', 1, '') };
    for (const name of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        configFile[`removeOn${name}`] = () => {};
    }
    const project = Object.create(Project.prototype);
    Object.assign(project, { configFile, config: null, builds: [], statics: [], scssFiles: {},
        onConfigSaveMutex: new Mutex() });
    const save = async (version, module, build) => {
        configFile.documentUser = TextDocument.create(uri, 'json', version,
            JSON.stringify({ module, build }));
        await project.onConfigSave();
    };
    const first = { name: 'main', src: ['./alpha'], stories: { output: './stories' } };
    const second = { name: 'aux', src: ['./beta'] };

    await save(1, 'Before', [first, second]);
    assert.deepEqual(project.getBuildsName(), ['Before@main', 'Before@aux']);
    assert.deepEqual(project.getBuildsNameWithStory(), ['Before@main']);
    assert.deepEqual(project.getMatchingBuildsByUri(sourceA).map(b => b.fullname), ['Before@main']);
    assert.deepEqual(project.getMatchingBuildsByUri(sourceB).map(b => b.fullname), ['Before@aux']);
    assert.deepEqual(project.getMatchingBuildsByUri(neighbor), []);
    const old = [...project.getBuilds()];

    await save(2, 'After', [{ ...first, src: ['./beta'], stories: undefined },
        { ...second, src: ['./alpha'], stories: { output: './stories-aux' } }]);
    assert.deepEqual(project.getBuildsName(), ['After@main', 'After@aux']);
    assert.deepEqual(project.getBuildsNameWithStory(), ['After@aux']);
    assert.equal(project.getBuild('Before@main'), undefined);
    assert.deepEqual(project.getMatchingBuildsByUri(sourceA).map(b => b.fullname), ['After@aux']);
    assert.deepEqual(project.getMatchingBuildsByUri(sourceB).map(b => b.fullname), ['After@main']);
    assert.deepEqual(project.getMatchingBuildsByUri(neighbor), []);
    assert.ok(old.every(b => !project.getBuilds().includes(b)));

    await save(3, 'Final', [second]);
    assert.deepEqual(project.getBuildsName(), ['Final@aux']);
    assert.deepEqual(project.getBuildsNameWithStory(), []);
    assert.deepEqual(project.getMatchingBuildsByUri(sourceA), []);
    assert.deepEqual(project.getMatchingBuildsByUri(sourceB).map(b => b.fullname), ['Final@aux']);
    assert.equal(initialized.length, 5);
    project.destroy();
});
