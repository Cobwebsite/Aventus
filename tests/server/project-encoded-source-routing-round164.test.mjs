import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { ProjectManager }, { Build }, { SettingsManager },
    { GenericServer }, { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/ProjectManager.ts', 'project/Build.ts',
    'settings/Settings.ts', 'GenericServer.ts', 'files/FilesManager.ts',
    'project/DependencyManager.ts', 'Mutex.ts',
]);

test('build routing decodes source URIs with spaces and follows a config source move', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-routing-spaces-'));
    const folder = join(root, 'my project');
    for (const sub of ['source files', 'source files-extra', 'new source']) {
        mkdirSync(join(folder, sub), { recursive: true });
    }
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        init: Build.prototype.init,
    };
    SettingsManager.instance = { settings: { defaultHideWarnings: false, watchFiles: false, useStats: false },
        settingsHtml: { customData: [] }, onSettingsChange: () => 'settings', onSettingsChangeHtml: () => 'html' };
    GenericServer.instance = { workspaces: [pathToFileURL(folder).href], logLevel: 0, isIDE: false,
        _extensionPath: join(import.meta.dirname, '..', '..'), connection: { sendNotification: () => {} } };
    FilesManager.instance = { onNewFile: () => 'subscription', removeOnNewFile: () => {} };
    DependencyManager.instance = { getPath: () => root };
    Build.prototype.init = async function () { this.initDone = true; };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        Build.prototype.init = previous.init;
    });

    const configPath = join(folder, 'aventus.conf.avt');
    const configUri = pathToFileURL(configPath).href;
    const configFile = { uri: configUri, path: configPath };
    for (const name of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        configFile[`removeOn${name}`] = () => {};
    }
    const project = Object.create(Project.prototype);
    Object.assign(project, { configFile, config: null, builds: [], statics: [], scssFiles: {},
        onConfigSaveMutex: new Mutex() });
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = { [configUri]: project };
    const save = async (version, src) => {
        configFile.documentUser = TextDocument.create(configUri, 'json', version,
            JSON.stringify({ module: 'Demo', build: [{ name: 'web', src: [src] }] }));
        await project.onConfigSave();
    };
    const owners = relative => manager.getMatchingBuildsByUri(pathToFileURL(join(folder, relative)).href)
        .map(build => build.fullname);

    await save(1, './source files');
    assert.deepEqual(owners('source files/card.wcl.avt'), ['Demo@web']);
    assert.deepEqual(owners('source files-extra/card.wcl.avt'), []);
    assert.deepEqual(owners('new source/card.wcl.avt'), []);

    await save(2, './new source');
    assert.deepEqual(owners('source files/card.wcl.avt'), []);
    assert.deepEqual(owners('new source/card.wcl.avt'), ['Demo@web']);
    project.destroy();
});
