import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { Build }, { SettingsManager }, { GenericServer }, { FilesManager },
    { DependencyManager }, { HttpServer }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'settings/Settings.ts', 'GenericServer.ts',
    'files/FilesManager.ts', 'project/DependencyManager.ts', 'live-server/HttpServer.ts',
]);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

test('destroyed project releases config/file subscriptions and static watcher, but a queued build still fires', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.project-destroy-round38-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'public');
    mkdirSync(input);
    const asset = join(input, 'asset.txt');
    const output = join(root, 'dist', 'asset.txt');
    writeFileSync(asset, 'initial');
    const configUri = pathToFileURL(join(root, 'aventus.conf.avt')).href;
    const callbacks = new Map();
    const fileEvents = new Map();
    const removed = [];
    const notifications = [];
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        http: HttpServer.getInstance, init: Build.prototype.init,
    };
    SettingsManager.instance = {
        settings: { defaultHideWarnings: false, watchFiles: true, useStats: false },
        settingsHtml: { customData: [] },
        onSettingsChange: () => 'settings', onSettingsChangeHtml: () => 'html',
    };
    GenericServer.instance = {
        workspaces: [pathToFileURL(root).href], logLevel: 4, isIDE: false, _noBuild: false,
        _extensionPath: join(import.meta.dirname, '..', '..'),
        connection: { delayBetweenBuild: () => 30, sendNotification: (...args) => notifications.push(args) },
    };
    let nextId = 0;
    FilesManager.instance = {
        onNewFile: callback => { const id = `file-${++nextId}`; fileEvents.set(id, callback); return id; },
        removeOnNewFile: id => { removed.push(id); fileEvents.delete(id); },
    };
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

    const configFile = {
        uri: configUri, path: join(root, 'aventus.conf.avt'), folderUri: pathToFileURL(root).href,
        documentUser: TextDocument.create(configUri, 'json', 1, JSON.stringify({
            module: 'Demo', build: [{ name: 'web', src: [] }],
            static: [{ name: 'assets', input: './public', output: './dist' }],
        })),
        validate: () => {},
    };
    for (const name of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        configFile[`on${name}`] = callback => { callbacks.set(name, callback); return name; };
        configFile[`removeOn${name}`] = id => { assert.equal(id, name); callbacks.delete(name); };
    }
    const project = new Project(configFile, false);
    await project.init();
    assert.equal(project.getBuilds().length, 1);
    assert.deepEqual(project.getStaticsName(), ['assets']);
    assert.equal(readFileSync(output, 'utf8'), 'initial');
    assert.equal(fileEvents.size, 2);
    const watcher = project.getStatic('assets').watcher;
    assert.ok(watcher);
    if (!watcher._readyEmitted) {
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('static watcher did not become ready')), 2000);
            watcher.once('ready', () => { clearTimeout(timeout); resolve(); });
        });
    }
    const build = project.getBuilds()[0];
    let compiled = 0;
    build._build = async () => { compiled++; };
    await build.build();
    project.destroy();
    assert.equal(callbacks.size, 0);
    assert.equal(fileEvents.size, 0);
    assert.equal(removed.length, 2);
    assert.equal(notifications.at(-1)[0], 'aventus/unregisterBuild');
    writeFileSync(asset, 'after destroy');
    await delay(300);
    assert.equal(readFileSync(output, 'utf8'), 'initial');
    assert.equal(compiled, 1);
    clearTimeout(build.timerBuild);
});
