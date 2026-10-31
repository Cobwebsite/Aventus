import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }, { Build }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'files/FilesManager.ts', 'project/DependencyManager.ts', 'Mutex.ts',
]);

test('a queued configuration save recovers after the preceding build initialization fails', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-project-queued-failure-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        init: Build.prototype.init, destroy: Build.prototype.destroy,
    };
    let releaseFirst;
    const gate = new Promise(resolve => { releaseFirst = resolve; });
    t.after(() => {
        releaseFirst();
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        Build.prototype.init = previous.init;
        Build.prototype.destroy = previous.destroy;
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
    Build.prototype.init = async function () {
        events.push(`start:${this.fullname}`);
        if (this.fullname === 'Demo@broken') {
            await gate;
            throw new Error('first initialization failed');
        }
        events.push(`ready:${this.fullname}`);
    };
    Build.prototype.destroy = function () { events.push(`destroy:${this.fullname}`); };

    const uri = pathToFileURL(join(root, 'aventus.conf.avt')).href;
    const content = name => JSON.stringify({ module: 'Demo', build: [{ name, src: [] }] });
    const configFile = { uri, path: join(root, 'aventus.conf.avt'),
        documentUser: TextDocument.create(uri, 'json', 1, content('broken')) };
    const project = Object.create(Project.prototype);
    Object.assign(project, { configFile, config: null, builds: [], statics: [], scssFiles: {},
        onConfigSaveMutex: new Mutex() });

    const first = project.onConfigSave();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(events, ['start:Demo@broken']);
    configFile.documentUser = TextDocument.create(uri, 'json', 2, content('fixed'));
    const second = project.onConfigSave();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(events, ['start:Demo@broken']);
    releaseFirst();

    const results = await Promise.allSettled([first, second]);
    assert.equal(results[0].status, 'rejected');
    assert.match(results[0].reason.message, /first initialization failed/);
    assert.equal(results[1].status, 'fulfilled');
    assert.deepEqual(project.getBuildsName(), ['Demo@fixed']);
    assert.deepEqual(events, [
        'start:Demo@broken', 'destroy:Demo@broken',
        'start:Demo@fixed', 'ready:Demo@fixed',
    ]);
});
