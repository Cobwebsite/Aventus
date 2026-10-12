import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

test('config reload with changed build/static filters retains prior static exports and allows them in buildAll', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.config-filters-round55-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    mkdirSync(join(root, 'public'));
    const source = join(root, 'public', 'asset.txt');
    writeFileSync(source, 'first');
    const uri = pathToFileURL(join(root, 'aventus.conf.avt')).href;
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        http: HttpServer.getInstance, init: Build.prototype.init, build: Build.prototype.build,
    };
    const subscriptions = new Set();
    let serial = 0;
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
        onNewFile: () => { const id = `file-${++serial}`; subscriptions.add(id); return id; },
        removeOnNewFile: id => subscriptions.delete(id),
    };
    DependencyManager.instance = { getPath: () => root };
    HttpServer.getInstance = () => ({ reload: () => {} });
    Build.prototype.init = async function () { this.initDone = true; };
    Build.prototype.build = async function () {};
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        HttpServer.getInstance = previous.http;
        Build.prototype.init = previous.init;
        Build.prototype.build = previous.build;
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
        buildsAllowed: ['alpha'], staticsAllowed: ['images'], onConfigSaveMutex: new Mutex() });
    const save = async (version, buildNames) => {
        configFile.documentUser = TextDocument.create(uri, 'json', version, JSON.stringify({
            module: 'Demo', build: buildNames.map(name => ({ name, src: [] })),
            static: ['images', 'fonts'].map(name => ({ name, input: './public', output: `./dist/${name}` })),
        }));
        await project.onConfigSave();
    };

    await save(1, ['alpha', 'beta']);
    assert.deepEqual(project.getBuildsName(), ['Demo@alpha']);
    assert.deepEqual(project.getStaticsName(), ['images']);
    assert.equal(readFileSync(join(root, 'dist', 'images', 'asset.txt'), 'utf8'), 'first');
    assert.equal(existsSync(join(root, 'dist', 'fonts', 'asset.txt')), false);
    assert.equal(subscriptions.size, 1);

    project.buildsAllowed = ['beta'];
    project.staticsAllowed = ['fonts'];
    writeFileSync(source, 'second');
    await save(2, ['alpha', 'beta', 'gamma']);
    assert.deepEqual(project.getBuildsName(), ['Demo@beta']);
    assert.deepEqual(project.getStaticsName(), ['images', 'fonts']);
    assert.equal(readFileSync(join(root, 'dist', 'fonts', 'asset.txt'), 'utf8'), 'second');
    assert.equal(subscriptions.size, 1);

    writeFileSync(source, 'third');
    await project.buildAll();
    assert.equal(readFileSync(join(root, 'dist', 'images', 'asset.txt'), 'utf8'), 'third');
    assert.equal(readFileSync(join(root, 'dist', 'fonts', 'asset.txt'), 'utf8'), 'third');

    configFile.documentUser = TextDocument.create(uri, 'json', 3, '{ invalid');
    await project.onConfigSave();
    assert.deepEqual(project.getBuildsName(), []);
    assert.deepEqual(project.getStaticsName(), ['images', 'fonts']);
    assert.equal(subscriptions.size, 0);
    project.destroy();
});
