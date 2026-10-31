import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }, { Build }, { Static }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'project/Static.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'files/FilesManager.ts', 'project/DependencyManager.ts', 'Mutex.ts',
]);

test('a failed second static export clears both statics and the build before retrying the same config', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-project-static-init-retry-'));
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

    const events = [];
    let fail = true;
    Build.prototype.init = async function () { events.push(`init:${this.fullname}`); };
    Build.prototype.destroy = function () { events.push(`destroy build:${this.fullname}`); };
    Static.prototype.export = async function () {
        events.push(`export:${this.name}`);
        if (this.name === 'images' && fail) throw new Error('images unavailable');
    };
    Static.prototype.destroy = function () { events.push(`destroy static:${this.name}`); };

    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const file = {
        uri, path,
        documentUser: TextDocument.create(uri, 'json', 1, JSON.stringify({
            module: 'Demo', build: [{ name: 'web', src: [] }],
            static: [
                { name: 'fonts', input: './fonts', output: './dist/fonts' },
                { name: 'images', input: './images', output: './dist/images' },
            ],
        })),
    };
    for (const event of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        file[`removeOn${event}`] = () => {};
    }
    const project = Object.create(Project.prototype);
    Object.assign(project, { configFile: file, config: null, builds: [], statics: [],
        scssFiles: {}, onConfigSaveMutex: new Mutex() });

    await assert.rejects(project.onConfigSave(), /images unavailable/);
    assert.deepEqual(project.getBuildsName(), []);
    assert.deepEqual(project.getStaticsName(), []);
    assert.deepEqual(events, [
        'init:Demo@web', 'export:fonts', 'export:images',
        'destroy build:Demo@web', 'destroy static:fonts', 'destroy static:images',
    ]);

    fail = false;
    await project.onConfigSave();
    assert.deepEqual(project.getBuildsName(), ['Demo@web']);
    assert.deepEqual(project.getStaticsName(), ['fonts', 'images']);
    assert.deepEqual(events.slice(6), ['init:Demo@web', 'export:fonts', 'export:images']);
    project.destroy();
});
