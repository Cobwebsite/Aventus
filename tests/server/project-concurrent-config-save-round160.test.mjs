import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { Build }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'files/FilesManager.ts', 'project/DependencyManager.ts', 'Mutex.ts',
]);

test('concurrent configuration saves serialize rebuilds and keep the newest build', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-project-config-queue-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const uri = pathToFileURL(join(root, 'aventus.conf.avt')).href;
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        init: Build.prototype.init, destroy: Build.prototype.destroy,
    };
    SettingsManager.instance = { settings: { defaultHideWarnings: false, watchFiles: false, useStats: false },
        settingsHtml: { customData: [] }, onSettingsChange: () => 'settings', onSettingsChangeHtml: () => 'html' };
    GenericServer.instance = { workspaces: [pathToFileURL(root).href], logLevel: 0, isIDE: false,
        _extensionPath: join(import.meta.dirname, '..', '..'), connection: { sendNotification: () => {} } };
    FilesManager.instance = { onNewFile: () => 'subscription', removeOnNewFile: () => {} };
    DependencyManager.instance = { getPath: () => root };
    const events = [];
    let releaseFirst;
    const gate = new Promise(resolve => { releaseFirst = resolve; });
    Build.prototype.init = async function () {
        events.push(`start:${this.fullname}`);
        if (this.fullname === 'Demo@first') await gate;
        events.push(`ready:${this.fullname}`);
    };
    Build.prototype.destroy = function () { events.push(`destroy:${this.fullname}`); };
    t.after(() => {
        releaseFirst();
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        Build.prototype.init = previous.init;
        Build.prototype.destroy = previous.destroy;
    });
    const content = name => JSON.stringify({ module: 'Demo', build: [{ name, src: [] }] });
    const configFile = { uri, path: join(root, 'aventus.conf.avt'),
        documentUser: TextDocument.create(uri, 'json', 1, content('first')) };
    const project = Object.create(Project.prototype);
    Object.assign(project, { configFile, config: null, builds: [], statics: [], scssFiles: {},
        onConfigSaveMutex: new Mutex() });

    const first = project.onConfigSave();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(events, ['start:Demo@first']);
    configFile.documentUser = TextDocument.create(uri, 'json', 2, content('second'));
    const second = project.onConfigSave();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(events, ['start:Demo@first']);
    releaseFirst();
    await Promise.all([first, second]);
    assert.deepEqual(project.getBuildsName(), ['Demo@second']);
    assert.equal(project.getBuilds().length, 1);
    assert.deepEqual(events, [
        'start:Demo@first', 'ready:Demo@first', 'destroy:Demo@first',
        'start:Demo@second', 'ready:Demo@second',
    ]);
});
