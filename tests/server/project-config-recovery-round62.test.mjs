import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

test('a project rebuilds its active outputs after malformed config is repaired', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-config-recovery-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    mkdirSync(join(root, 'public'));
    writeFileSync(join(root, 'public', 'asset.txt'), 'initial');
    const uri = pathToFileURL(join(root, 'aventus.conf.avt')).href;
    const before = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        http: HttpServer.getInstance, init: Build.prototype.init, build: Build.prototype.build,
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
    Build.prototype.build = async function () { initialized.push(`build:${this.fullname}`); };
    t.after(() => {
        SettingsManager.instance = before.settings;
        GenericServer.instance = before.server;
        FilesManager.instance = before.files;
        DependencyManager.instance = before.dependency;
        HttpServer.getInstance = before.http;
        Build.prototype.init = before.init;
        Build.prototype.build = before.build;
    });

    const configFile = {
        uri, path: join(root, 'aventus.conf.avt'),
        documentUser: TextDocument.create(uri, 'json', 1, ''),
    };
    for (const event of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        configFile[`removeOn${event}`] = () => {};
    }
    const project = Object.create(Project.prototype);
    Object.assign(project, {
        configFile, config: null, builds: [], statics: [], scssFiles: {},
        onConfigSaveMutex: new Mutex(),
    });
    const save = async (version, value) => {
        configFile.documentUser = TextDocument.create(uri, 'json', version, value);
        await project.onConfigSave();
    };
    const valid = (build, output) => JSON.stringify({
        module: 'Demo', build: [{ name: build, src: [] }],
        static: [{ name: output, input: './public', output: `./dist/${output}` }],
    });

    await save(1, valid('first', 'first'));
    assert.deepEqual(project.getBuildsName(), ['Demo@first']);
    assert.equal(readFileSync(join(root, 'dist', 'first', 'asset.txt'), 'utf8'), 'initial');

    await save(2, '{ bad json');
    assert.equal(project.getConfig(), null);
    assert.deepEqual(project.getBuildsName(), []);

    writeFileSync(join(root, 'public', 'asset.txt'), 'recovered');
    await save(3, valid('second', 'second'));
    assert.deepEqual(project.getBuildsName(), ['Demo@second']);
    assert.deepEqual(initialized, ['Demo@first', 'Demo@second']);
    assert.equal(readFileSync(join(root, 'dist', 'second', 'asset.txt'), 'utf8'), 'recovered');
    await project.buildAll();
    assert.deepEqual(initialized, ['Demo@first', 'Demo@second', 'build:Demo@second']);
    assert.equal(readFileSync(join(root, 'dist', 'second', 'asset.txt'), 'utf8'), 'recovered');
    project.destroy();
});
