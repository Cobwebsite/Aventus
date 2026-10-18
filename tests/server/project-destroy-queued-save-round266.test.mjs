import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { Build }, { Static }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'project/Static.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'files/FilesManager.ts', 'project/DependencyManager.ts', 'Mutex.ts',
]);

test('a queued config save does not recreate builds or statics after project destruction', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-project-destroy-queued-save-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        init: Build.prototype.init, buildDestroy: Build.prototype.destroy,
        export: Static.prototype.export, staticDestroy: Static.prototype.destroy,
    };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        Build.prototype.init = previous.init;
        Build.prototype.destroy = previous.buildDestroy;
        Static.prototype.export = previous.export;
        Static.prototype.destroy = previous.staticDestroy;
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

    let entered;
    let release;
    const inInit = new Promise(resolve => { entered = resolve; });
    const blocked = new Promise(resolve => { release = resolve; });
    const events = [];
    Build.prototype.init = async function () {
        events.push(`init:${this.fullname}`);
        entered();
        await blocked;
    };
    Build.prototype.destroy = function () { events.push(`destroy:${this.fullname}`); };
    Static.prototype.export = async function () { events.push(`export:${this.name}`); };
    Static.prototype.destroy = function () { events.push(`destroy static:${this.name}`); };

    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const document = (version, name) => TextDocument.create(uri, 'json', version, JSON.stringify({
        module: 'Demo', build: [{ name, src: [] }],
        static: [{ name: 'assets', input: './assets', output: './dist/assets' }],
    }));
    const file = { path, uri, documentUser: document(1, 'old') };
    for (const event of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        file[`removeOn${event}`] = () => {};
    }
    const project = Object.create(Project.prototype);
    Object.assign(project, { configFile: file, config: null, builds: [], statics: [],
        scssFiles: {}, onConfigSaveMutex: new Mutex() });

    const first = project.onConfigSave();
    await inInit;
    file.documentUser = document(2, 'new');
    const queued = project.onConfigSave();
    project.destroy();
    release();
    await Promise.all([first, queued]);

    assert.deepEqual(events, ['init:Demo@old', 'destroy:Demo@old']);
    assert.deepEqual(project.getBuildsName(), []);
    assert.deepEqual(project.getStaticsName(), []);
});
