import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { Build }, { Static }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'project/Static.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'files/FilesManager.ts', 'project/DependencyManager.ts', 'Mutex.ts',
]);

function setup(t, config) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-project-destroy-phases-'));
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        buildInit: Build.prototype.init, buildDestroy: Build.prototype.destroy,
        staticExport: Static.prototype.export, staticDestroy: Static.prototype.destroy,
    };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        Build.prototype.init = previous.buildInit;
        Build.prototype.destroy = previous.buildDestroy;
        Static.prototype.export = previous.staticExport;
        Static.prototype.destroy = previous.staticDestroy;
        rmSync(root, { recursive: true, force: true });
    });
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
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const file = { path, uri, documentUser: TextDocument.create(uri, 'json', 1, JSON.stringify(config)) };
    for (const name of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        file[`removeOn${name}`] = () => {};
    }
    const project = Object.create(Project.prototype);
    Object.assign(project, { configFile: file, config: null, builds: [], statics: [],
        scssFiles: {}, onConfigSaveMutex: new Mutex() });
    return project;
}

function gate() {
    let enter;
    let release;
    return {
        entered: new Promise(resolve => { enter = resolve; }),
        pending: new Promise(resolve => { release = resolve; }),
        enter: () => enter(), release: () => release(),
    };
}

test('destroy during first build initialization prevents later builds and static exports', async t => {
    const project = setup(t, {
        module: 'Demo',
        build: [{ name: 'first', src: [] }, { name: 'second', src: [] }],
        static: [{ name: 'assets', input: './assets', output: './dist/assets' }],
    });
    const blocked = gate();
    const events = [];
    Build.prototype.init = async function () {
        events.push(`init:${this.fullname}`);
        if (this.fullname === 'Demo@first') { blocked.enter(); await blocked.pending; }
    };
    Build.prototype.destroy = function () { events.push(`destroy:${this.fullname}`); };
    Static.prototype.export = async function () { events.push(`export:${this.name}`); };
    Static.prototype.destroy = function () { events.push(`destroy static:${this.name}`); };

    const saving = project.onConfigSave();
    await blocked.entered;
    project.destroy();
    blocked.release();
    await saving;

    assert.deepEqual(events, ['init:Demo@first', 'destroy:Demo@first']);
    assert.deepEqual(project.getBuildsName(), []);
    assert.deepEqual(project.getStaticsName(), []);
});

test('destroy during first static export prevents the next static export', async t => {
    const project = setup(t, {
        module: 'Demo', build: [{ name: 'web', src: [] }],
        static: [
            { name: 'fonts', input: './fonts', output: './dist/fonts' },
            { name: 'images', input: './images', output: './dist/images' },
        ],
    });
    const blocked = gate();
    const events = [];
    Build.prototype.init = async function () { events.push(`init:${this.fullname}`); };
    Build.prototype.destroy = function () { events.push(`destroy:${this.fullname}`); };
    Static.prototype.export = async function () {
        events.push(`export:${this.name}`);
        if (this.name === 'fonts') { blocked.enter(); await blocked.pending; }
    };
    Static.prototype.destroy = function () { events.push(`destroy static:${this.name}`); };

    const saving = project.onConfigSave();
    await blocked.entered;
    project.destroy();
    blocked.release();
    await saving;

    assert.deepEqual(events, [
        'init:Demo@web', 'export:fonts', 'destroy:Demo@web', 'destroy static:fonts',
    ]);
    assert.deepEqual(project.getBuildsName(), []);
    assert.deepEqual(project.getStaticsName(), []);
});
