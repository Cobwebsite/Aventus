import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { ProjectManager }, { Build }, { SettingsManager },
    { GenericServer }, { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/ProjectManager.ts', 'project/Build.ts',
    'settings/Settings.ts', 'GenericServer.ts', 'files/FilesManager.ts',
    'project/DependencyManager.ts', 'Mutex.ts',
]);

test('allowed builds override disabled entries while config revisions update routing and choices independently', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-allowed-routing-round186-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        init: Build.prototype.init, destroy: Build.prototype.destroy,
    };
    SettingsManager.instance = {
        settings: { defaultHideWarnings: false, watchFiles: false, useStats: false },
        settingsHtml: { customData: [] },
        onSettingsChange: () => 'settings', onSettingsChangeHtml: () => 'html',
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
    Build.prototype.destroy = function () { events.push(`destroy:${this.fullname}`); };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        Build.prototype.init = previous.init;
        Build.prototype.destroy = previous.destroy;
    });

    const create = name => {
        const dir = join(root, name);
        mkdirSync(dir);
        const path = join(dir, 'aventus.conf.avt');
        const uri = pathToFileURL(path).href;
        const file = { path, uri };
        const project = Object.create(Project.prototype);
        Object.assign(project, { configFile: file, config: null, builds: [], statics: [],
            scssFiles: {}, onConfigSaveMutex: new Mutex() });
        return { file, project, dir };
    };
    const alpha = create('alpha');
    const beta = create('beta');
    alpha.project.buildsAllowed = ['selected'];
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = { [alpha.file.uri]: alpha.project, [beta.file.uri]: beta.project };
    const save = async (entry, version, builds) => {
        entry.file.documentUser = TextDocument.create(entry.file.uri, 'json', version,
            JSON.stringify({ module: entry === alpha ? 'Alpha' : 'Beta', build: builds }));
        await entry.project.onConfigSave();
    };
    const choices = () => manager.getAllBuilds().map(value => value.name);
    const owners = path => manager.getMatchingBuildsByUri(pathToFileURL(join(root, path)).href)
        .map(build => build.fullname);

    await save(alpha, 1, [
        { name: 'selected', disabled: true, src: ['./src/a'] },
        { name: 'unselected', src: ['./src/b'] },
    ]);
    await save(beta, 1, [{ name: 'active', src: ['./src/b'] }]);
    assert.deepEqual(choices(), ['Alpha@selected', 'Beta@active']);
    assert.deepEqual(owners('alpha/src/a/one.lib.avt'), ['Alpha@selected']);
    assert.deepEqual(owners('alpha/src/b/two.lib.avt'), []);
    assert.deepEqual(owners('beta/src/b/two.lib.avt'), ['Beta@active']);

    await save(alpha, 2, [
        { name: 'selected', disabled: true, src: ['./src/c'] },
        { name: 'unselected', src: ['./src/b'] },
    ]);
    assert.deepEqual(choices(), ['Alpha@selected', 'Beta@active']);
    assert.deepEqual(owners('alpha/src/a/one.lib.avt'), []);
    assert.deepEqual(owners('alpha/src/c/three.lib.avt'), ['Alpha@selected']);
    assert.deepEqual(owners('beta/src/b/two.lib.avt'), ['Beta@active']);

    alpha.project.buildsAllowed = undefined;
    await save(alpha, 3, [
        { name: 'selected', disabled: true, src: ['./src/c'] },
        { name: 'unselected', src: ['./src/b'] },
        { name: 'new', src: ['./src/d'] },
    ]);
    assert.deepEqual(choices(), ['Alpha@unselected', 'Alpha@new', 'Beta@active']);
    assert.deepEqual(owners('alpha/src/c/three.lib.avt'), []);
    assert.deepEqual(owners('alpha/src/b/two.lib.avt'), ['Alpha@unselected']);
    assert.deepEqual(owners('alpha/src/d/four.lib.avt'), ['Alpha@new']);
    assert.deepEqual(owners('beta/src/b/two.lib.avt'), ['Beta@active']);
    assert.deepEqual(events, [
        'init:Alpha@selected', 'init:Beta@active',
        'destroy:Alpha@selected', 'init:Alpha@selected',
        'destroy:Alpha@selected',
        'init:Alpha@unselected', 'init:Alpha@new',
    ]);
});
