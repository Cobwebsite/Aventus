import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { Build }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { HttpServer }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'files/FilesManager.ts', 'project/DependencyManager.ts',
    'live-server/HttpServer.ts', 'Mutex.ts',
]);

test('config saves release old build file subscriptions while replacing several builds and statics', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.config-subs-round47-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    mkdirSync(join(root, 'public'));
    writeFileSync(join(root, 'public', 'asset.txt'), 'asset');
    const uri = pathToFileURL(join(root, 'aventus.conf.avt')).href;
    const before = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        http: HttpServer.getInstance, init: Build.prototype.init,
    };
    const subscriptions = new Set();
    const removed = [];
    let nextId = 0;
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
    FilesManager.instance = {
        onNewFile: () => { const id = `file-${++nextId}`; subscriptions.add(id); return id; },
        removeOnNewFile: id => { removed.push(id); subscriptions.delete(id); },
    };
    DependencyManager.instance = { getPath: () => root };
    HttpServer.getInstance = () => ({ reload: () => {} });
    Build.prototype.init = async function () { this.initDone = true; };
    t.after(() => {
        SettingsManager.instance = before.settings;
        GenericServer.instance = before.server;
        FilesManager.instance = before.files;
        DependencyManager.instance = before.dependency;
        HttpServer.getInstance = before.http;
        Build.prototype.init = before.init;
    });

    const configFile = {
        uri, path: join(root, 'aventus.conf.avt'),
        documentUser: TextDocument.create(uri, 'json', 1, ''),
    };
    for (const event of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        configFile[`removeOn${event}`] = () => {};
    }
    const project = Object.create(Project.prototype);
    Object.assign(project, { configFile, config: null, builds: [], statics: [], scssFiles: {},
        onConfigSaveMutex: new Mutex() });
    const save = async (version, names, staticNames) => {
        configFile.documentUser = TextDocument.create(uri, 'json', version, JSON.stringify({
            module: 'Demo', build: names.map(name => ({ name, src: [] })),
            static: staticNames.map(name => ({ name, input: './public', output: `./dist/${name}` })),
        }));
        await project.onConfigSave();
    };

    await save(1, ['alpha', 'beta'], ['images', 'fonts']);
    assert.deepEqual([...subscriptions], ['file-1', 'file-2']);
    const firstBuilds = [...project.getBuilds()];

    await save(2, ['gamma', 'delta'], ['media', 'docs']);
    assert.deepEqual(project.getBuildsName(), ['Demo@gamma', 'Demo@delta']);
    assert.deepEqual(project.getStaticsName(), ['images', 'fonts', 'media', 'docs']);
    assert.deepEqual([...subscriptions], ['file-3', 'file-4']);
    assert.deepEqual(removed, ['file-1', 'file-2']);
    assert.ok(firstBuilds.every(build => !project.getBuilds().includes(build)));

    // A repeated save still rebuilds objects, but must not retain subscriptions
    // belonging to the previous pair of builds.
    await save(3, ['gamma', 'delta'], ['media', 'docs']);
    assert.deepEqual(project.getBuildsName(), [
        'Demo@gamma', 'Demo@delta', 'Demo@gamma', 'Demo@delta',
    ]);
    assert.deepEqual(project.getStaticsName(), [
        'images', 'fonts', 'media', 'docs', 'media', 'docs',
    ]);
    assert.deepEqual([...subscriptions], ['file-5', 'file-6']);
    assert.deepEqual(removed, ['file-1', 'file-2', 'file-3', 'file-4']);

    configFile.documentUser = TextDocument.create(uri, 'json', 4, '{ invalid');
    await project.onConfigSave();
    assert.equal(project.getConfig(), null);
    assert.deepEqual(project.getBuildsName(), []);
    assert.equal(project.getStaticsName().length, 6);
    assert.deepEqual([...subscriptions], []);
    assert.deepEqual(removed, ['file-1', 'file-2', 'file-3', 'file-4',
        'file-3', 'file-4', 'file-5', 'file-6']);
    project.destroy();
});
