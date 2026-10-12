import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { Build }, { SettingsManager }, { GenericServer }, { FilesManager },
    { DependencyManager }, { HttpServer }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'settings/Settings.ts', 'GenericServer.ts', 'files/FilesManager.ts',
    'project/DependencyManager.ts', 'live-server/HttpServer.ts', 'Mutex.ts',
]);

test('changing only a static destination leaves the earlier files but stops exporting there', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.static-destination-cycle-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'public');
    mkdirSync(input);
    const source = join(input, 'asset.txt');
    writeFileSync(source, 'first');
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
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
    let project;
    t.after(() => {
        project?.destroy();
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        HttpServer.getInstance = previous.http;
        Build.prototype.init = previous.init;
        Build.prototype.build = previous.build;
    });
    const configFile = { path, uri, documentUser: TextDocument.create(uri, 'json', 0, '') };
    for (const event of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        configFile[`removeOn${event}`] = () => {};
    }
    project = Object.create(Project.prototype);
    Object.assign(project, { configFile, config: null, builds: [], statics: [],
        scssFiles: {}, onConfigSaveMutex: new Mutex() });
    const save = async (version, destination) => {
        configFile.documentUser = TextDocument.create(uri, 'json', version, JSON.stringify({
            module: 'Demo', build: [{ name: 'web', src: [] }],
            static: [{ name: 'assets', input: './public', output: destination }],
        }));
        await project.onConfigSave();
    };

    await save(1, './dist/old');
    assert.equal(project.getStaticsName().length, 1, JSON.stringify(project.getConfig()));
    assert.equal(readFileSync(join(root, 'dist', 'old', 'asset.txt'), 'utf8'), 'first');
    writeFileSync(source, 'second');
    await save(2, './dist/new');
    assert.equal(readFileSync(join(root, 'dist', 'new', 'asset.txt'), 'utf8'), 'second');
    assert.deepEqual(project.getStaticsName(), ['assets']);
    writeFileSync(source, 'third');
    await project.buildAll();
    assert.equal(readFileSync(join(root, 'dist', 'old', 'asset.txt'), 'utf8'), 'first');
    assert.equal(readFileSync(join(root, 'dist', 'new', 'asset.txt'), 'utf8'), 'third');
});
