import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

test('two projects export a shared static source independently after one changes its input', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.project-static-shared-round140-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    for (const folder of ['shared', 'first/local', 'second/local']) {
        mkdirSync(join(root, folder), { recursive: true });
    }
    writeFileSync(join(root, 'shared', 'asset.txt'), 'shared one');
    writeFileSync(join(root, 'first', 'local', 'asset.txt'), 'first local');
    writeFileSync(join(root, 'second', 'local', 'asset.txt'), 'second local');

    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        http: HttpServer.getInstance, init: Build.prototype.init, build: Build.prototype.build,
    };
    SettingsManager.instance = {
        settings: { defaultHideWarnings: false, watchFiles: false, useStats: false },
        settingsHtml: { customData: [] }, onSettingsChange: () => 'settings',
        onSettingsChangeHtml: () => 'html',
    };
    GenericServer.instance = {
        workspaces: [pathToFileURL(root).href], logLevel: 0, isIDE: false,
        _extensionPath: join(import.meta.dirname, '..', '..'),
        connection: { sendNotification() {} },
    };
    FilesManager.instance = { onNewFile: () => 'subscription', removeOnNewFile() {} };
    DependencyManager.instance = { getPath: () => root };
    HttpServer.getInstance = () => ({ reload() {} });
    Build.prototype.init = async function () { this.initDone = true; };
    Build.prototype.build = async function () {};
    t.after(() => {
        for (const { project } of entries) project.destroy();
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        HttpServer.getInstance = previous.http;
        Build.prototype.init = previous.init;
        Build.prototype.build = previous.build;
    });

    const entries = ['first', 'second'].map(folder => {
        const path = join(root, folder, 'aventus.conf.avt');
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
    const save = async (entry, version, input) => {
        entry.file.documentUser = TextDocument.create(entry.file.uri, 'json', version,
            JSON.stringify({ module: entry.folder, build: [{ name: 'web', src: [] }], static: [{
                name: 'assets', input, output: './dist/assets',
            }] }));
        await entry.project.onConfigSave();
    };
    const output = entry => readFileSync(join(root, entry.folder, 'dist', 'assets', 'asset.txt'), 'utf8');
    await save(entries[0], 1, '../shared');
    await save(entries[1], 1, '../shared');
    assert.deepEqual(manager.getAllStatics(), entries.map(({ file }) => ({ name: 'assets', uri: file.uri, index: 0 })),
        JSON.stringify(entries.map(({ project }) => project.getConfig())));
    assert.equal(output(entries[0]), 'shared one');
    assert.equal(output(entries[1]), 'shared one');

    writeFileSync(join(root, 'shared', 'asset.txt'), 'shared two');
    await save(entries[0], 2, './local');
    await entries[1].project.buildAll();
    assert.equal(output(entries[0]), 'first local');
    assert.equal(output(entries[1]), 'shared two');
    assert.deepEqual(manager.getAllStatics(), entries.map(({ file }) => ({ name: 'assets', uri: file.uri, index: 0 })));

    await save(entries[1], 2, './local');
    assert.equal(output(entries[0]), 'first local');
    assert.equal(output(entries[1]), 'second local');
});
