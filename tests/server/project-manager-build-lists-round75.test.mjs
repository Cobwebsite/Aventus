import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { ProjectManager }, { Build }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { HttpServer }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/ProjectManager.ts', 'project/Build.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'files/FilesManager.ts', 'project/DependencyManager.ts',
    'live-server/HttpServer.ts', 'Mutex.ts',
]);

test('aggregate build, Storybook, npm and static choices retain project URIs across reloads', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-project-lists-round75-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        http: HttpServer.getInstance, init: Build.prototype.init,
    };
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
    Build.prototype.init = async function () { this.initDone = true; };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        HttpServer.getInstance = previous.http;
        Build.prototype.init = previous.init;
    });

    const entries = ['first', 'second'].map(folder => {
        const dir = join(root, folder);
        mkdirSync(dir);
        const path = join(dir, 'aventus.conf.avt');
        const uri = pathToFileURL(path).href;
        const file = { path, uri, documentUser: TextDocument.create(uri, 'json', 0, '') };
        for (const event of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
            file[`removeOn${event}`] = () => {};
        }
        const project = Object.create(Project.prototype);
        Object.assign(project, { configFile: file, config: null, builds: [], statics: [],
            scssFiles: {}, onConfigSaveMutex: new Mutex() });
        return { folder, file, project };
    });
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = Object.fromEntries(entries.map(({ file, project }) => [file.uri, project]));
    const save = async (entry, version, build, staticItems = []) => {
        entry.file.documentUser = TextDocument.create(entry.file.uri, 'json', version,
            JSON.stringify({ module: 'Same', build, static: staticItems }));
        await entry.project.onConfigSave();
    };
    const plain = { name: 'web', src: [] };
    const story = { ...plain, stories: { output: './stories' } };
    const npm = { ...plain, compile: [{ outputNpm: './npm' }] };
    const staticItem = { name: 'assets', input: './public', output: './dist/assets' };
    for (const { folder } of entries) mkdirSync(join(root, folder, 'public'));

    await save(entries[0], 1, [story], [staticItem]);
    await save(entries[1], 1, [npm], [staticItem]);
    const expected = entries.map(({ file }) => ({ name: 'Same@web', uri: file.uri }));
    assert.deepEqual(manager.getAllBuilds(), expected);
    assert.deepEqual(manager.getAllBuildsWithStory(), [expected[0]]);
    assert.deepEqual(manager.getAllBuildsWithNpm(), [expected[0], expected[1]]);
    assert.deepEqual(manager.getAllStatics(), entries.map(({ file }) =>
        ({ name: 'assets', uri: file.uri })));

    await save(entries[0], 2, [plain]);
    await save(entries[1], 2, [story], [staticItem]);
    assert.deepEqual(manager.getAllBuilds(), expected);
    assert.deepEqual(manager.getAllBuildsWithStory(), [expected[1]]);
    assert.deepEqual(manager.getAllBuildsWithNpm(), [expected[1]]);
    assert.deepEqual(manager.getAllStatics(), [entries[1]].map(({ file }) =>
        ({ name: 'assets', uri: file.uri })));

    entries[0].file.documentUser = TextDocument.create(entries[0].file.uri, 'json', 3, '{ invalid');
    await entries[0].project.onConfigSave();
    assert.deepEqual(manager.getAllBuilds(), [expected[1]]);
    assert.deepEqual(manager.getAllBuildsWithStory(), [expected[1]]);
    assert.deepEqual(manager.getAllBuildsWithNpm(), [expected[1]]);
    assert.deepEqual(manager.getAllStatics(), [entries[1]].map(({ file }) =>
        ({ name: 'assets', uri: file.uri })));

    delete manager.projects[entries[1].file.uri];
    assert.deepEqual(manager.getAllBuilds(), []);
    assert.deepEqual(manager.getAllBuildsWithStory(), []);
    assert.deepEqual(manager.getAllBuildsWithNpm(), []);
    assert.deepEqual(manager.getAllStatics(), []);

    for (const { project } of entries) project.destroy();
});
