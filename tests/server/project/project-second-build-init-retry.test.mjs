import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }, { Build }, { Static }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'project/Static.ts',
    'settings/Settings.ts', 'GenericServer.ts', 'files/FilesManager.ts',
    'project/DependencyManager.ts', 'Mutex.ts',
]);

test('second build init failure clears earlier build and same config can be retried', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-second-build-init-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        init: Build.prototype.init, destroy: Build.prototype.destroy,
        export: Static.prototype.export,
    };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        Build.prototype.init = previous.init;
        Build.prototype.destroy = previous.destroy;
        Static.prototype.export = previous.export;
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
    Build.prototype.init = async function () {
        events.push(`init:${this.fullname}`);
        if (this.buildConfig.name === 'second' && fail) {
            fail = false;
            throw new Error('second build failed');
        }
    };
    Build.prototype.destroy = function () { events.push(`destroy:${this.fullname}`); };
    Static.prototype.export = async function () { events.push(`export:${this.name}`); };

    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const content = JSON.stringify({
        module: 'Demo',
        build: ['first', 'second', 'third'].map(name => ({ name, src: [] })),
        static: [{ name: 'assets', input: './assets', output: './dist/assets' }],
    });
    const file = { path, uri, documentUser: TextDocument.create(uri, 'json', 1, content) };
    for (const event of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        file[`removeOn${event}`] = () => {};
    }
    const project = Object.create(Project.prototype);
    Object.assign(project, { configFile: file, config: null, builds: [], statics: [],
        scssFiles: {}, onConfigSaveMutex: new Mutex() });

    await assert.rejects(project.onConfigSave(), /second build failed/);
    assert.deepEqual(project.getBuildsName(), []);
    assert.deepEqual(project.getStaticsName(), []);
    assert.deepEqual(events, [
        'init:Demo@first', 'init:Demo@second',
        'destroy:Demo@first', 'destroy:Demo@second',
    ]);

    file.documentUser = TextDocument.create(uri, 'json', 2, content);
    await project.onConfigSave();
    assert.deepEqual(project.getBuildsName(), ['Demo@first', 'Demo@second', 'Demo@third']);
    assert.deepEqual(project.getStaticsName(), ['assets']);
    assert.deepEqual(events.slice(4), [
        'init:Demo@first', 'init:Demo@second', 'init:Demo@third', 'export:assets',
    ]);
    project.destroy();
});
