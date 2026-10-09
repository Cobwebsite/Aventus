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

test('config reload updates ordinary, Storybook and npm build lists and respects disabled builds', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.build-lists-round39-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const uri = pathToFileURL(join(root, 'aventus.conf.avt')).href;
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
    Build.prototype.init = async function () { initialized.push(this.fullname); this.initDone = true; };
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
    const save = async (version, build) => {
        configFile.documentUser = TextDocument.create(uri, 'json', version,
            JSON.stringify({ module: 'Demo', build }));
        await project.onConfigSave();
    };
    const ordinary = { name: 'plain', src: [] };
    const npm = { name: 'package', src: [], compile: [{ outputNpm: './dist/npm' }] };
    const story = { name: 'storybook', src: [], stories: { output: './stories' } };
    const disabled = { name: 'off', src: [], disabled: true,
        compile: [{ outputNpm: './dist/off' }], stories: { output: './off-stories' } };

    await save(1, [ordinary, npm, story, disabled]);
    assert.deepEqual(project.getBuildsName(), ['Demo@plain', 'Demo@package', 'Demo@storybook']);
    assert.deepEqual(project.getBuildsNameWithStory(), ['Demo@storybook']);
    assert.deepEqual(project.getBuildsNameWithNpm(), ['Demo@package', 'Demo@storybook']);
    assert.equal(project.getBuild('Demo@off'), undefined);

    await save(2, [{ ...ordinary, stories: { output: './plain-stories' } },
        { ...npm, compile: [] }, { ...story, stories: undefined }, disabled]);
    assert.deepEqual(project.getBuildsName(), ['Demo@plain', 'Demo@package', 'Demo@storybook']);
    assert.deepEqual(project.getBuildsNameWithStory(), ['Demo@plain']);
    assert.deepEqual(project.getBuildsNameWithNpm(), ['Demo@plain']);
    assert.deepEqual(initialized, ['Demo@plain', 'Demo@package', 'Demo@storybook',
        'Demo@plain', 'Demo@package', 'Demo@storybook']);

    await save(3, [disabled]);
    assert.deepEqual(project.getBuildsName(), []);
    assert.deepEqual(project.getBuildsNameWithStory(), []);
    assert.deepEqual(project.getBuildsNameWithNpm(), []);
    project.destroy();
});
