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

test('a queued config save uses the newest static output after an earlier export fails', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-project-static-queued-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        init: Build.prototype.init, buildDestroy: Build.prototype.destroy,
        export: Static.prototype.export, staticDestroy: Static.prototype.destroy,
    };
    let releaseExport;
    const exportGate = new Promise(resolve => { releaseExport = resolve; });
    t.after(() => {
        releaseExport();
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

    const events = [];
    Build.prototype.init = async function () { events.push(`init:${this.fullname}`); };
    Build.prototype.destroy = function () { events.push(`destroy build:${this.fullname}`); };
    Static.prototype.export = async function () {
        events.push(`export:${this.name}`);
        if (this.name === 'old') {
            await exportGate;
            throw new Error('old export failed');
        }
    };
    Static.prototype.destroy = function () { events.push(`destroy static:${this.name}`); };

    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const content = (build, staticName) => JSON.stringify({
        module: 'Demo', build: [{ name: build, src: [] }],
        static: [{ name: staticName, input: `./${staticName}`, output: `./dist/${staticName}` }],
    });
    const file = { uri, path, documentUser: TextDocument.create(uri, 'json', 1, content('first', 'old')) };
    const project = Object.create(Project.prototype);
    Object.assign(project, { configFile: file, config: null, builds: [], statics: [],
        scssFiles: {}, onConfigSaveMutex: new Mutex() });

    const first = project.onConfigSave();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(events, ['init:Demo@first', 'export:old']);

    file.documentUser = TextDocument.create(uri, 'json', 2, content('second', 'new'));
    const second = project.onConfigSave();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(events, ['init:Demo@first', 'export:old']);
    releaseExport();

    const results = await Promise.allSettled([first, second]);
    assert.equal(results[0].status, 'rejected');
    assert.match(results[0].reason.message, /old export failed/);
    assert.equal(results[1].status, 'fulfilled');
    assert.deepEqual(project.getBuildsName(), ['Demo@second']);
    assert.deepEqual(project.getStaticsName(), ['new']);
    assert.deepEqual(events, [
        'init:Demo@first', 'export:old',
        'destroy build:Demo@first', 'destroy static:old',
        'init:Demo@second', 'export:new',
    ]);
});
