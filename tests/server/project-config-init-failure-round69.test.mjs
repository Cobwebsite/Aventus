import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { Build }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'files/FilesManager.ts', 'project/DependencyManager.ts', 'Mutex.ts',
]);

test('a failed build initialization releases resources and permits the next config save', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-config-init-failure-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const uri = pathToFileURL(join(root, 'aventus.conf.avt')).href;
    const old = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        init: Build.prototype.init,
    };
    SettingsManager.instance = { settings: { defaultHideWarnings: false, watchFiles: false, useStats: false },
        settingsHtml: { customData: [] }, onSettingsChange: () => 'settings', onSettingsChangeHtml: () => 'html' };
    GenericServer.instance = { workspaces: [pathToFileURL(root).href], logLevel: 0, isIDE: false,
        _extensionPath: join(import.meta.dirname, '..', '..'), connection: { sendNotification: () => {} } };
    FilesManager.instance = { onNewFile: () => 'subscription', removeOnNewFile: () => {} };
    DependencyManager.instance = { getPath: () => root };
    let attempts = 0;
    Build.prototype.init = async function () {
        attempts++;
        if (attempts === 1) throw new Error('simulated init failure');
        this.initDone = true;
    };
    t.after(() => {
        SettingsManager.instance = old.settings;
        GenericServer.instance = old.server;
        FilesManager.instance = old.files;
        DependencyManager.instance = old.dependency;
        Build.prototype.init = old.init;
    });
    const configFile = { uri, path: join(root, 'aventus.conf.avt'),
        documentUser: TextDocument.create(uri, 'json', 1, JSON.stringify({ module: 'Demo', build: [{ name: 'first', src: [] }] })) };
    for (const event of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        configFile[`removeOn${event}`] = () => {};
    }
    const project = Object.create(Project.prototype);
    Object.assign(project, { configFile, config: null, builds: [], statics: [], scssFiles: {},
        onConfigSaveMutex: new Mutex() });
    await assert.rejects(project.onConfigSave(), /simulated init failure/);
    assert.equal(attempts, 1);
    assert.deepEqual(project.getBuildsName(), []);

    configFile.documentUser = TextDocument.create(uri, 'json', 2,
        JSON.stringify({ module: 'Demo', build: [{ name: 'second', src: [] }] }));
    await project.onConfigSave();
    assert.equal(attempts, 2);
    assert.deepEqual(project.getBuildsName(), ['Demo@second']);
    project.destroy();
});
