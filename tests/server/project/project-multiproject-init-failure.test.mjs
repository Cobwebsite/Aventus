import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }, { ProjectManager }, { Build }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/ProjectManager.ts', 'project/Build.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'files/FilesManager.ts', 'project/DependencyManager.ts', 'Mutex.ts',
]);

test('a failed build initialization in one project leaves another routed and permits local recovery', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-project-init-failure-round278-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    for (const folder of ['first', 'second']) mkdirSync(join(root, folder));
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        init: Build.prototype.init, destroy: Build.prototype.destroy,
    };
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
    const destroyed = [];
    let failFirst = false;
    Build.prototype.init = async function () {
        if (failFirst && this.fullname === 'First@new') throw new Error('first initialization failed');
    };
    Build.prototype.destroy = function () { destroyed.push(this); };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        Build.prototype.init = previous.init;
        Build.prototype.destroy = previous.destroy;
    });

    const make = folder => {
        const path = join(root, folder, 'aventus.conf.avt');
        const uri = pathToFileURL(path).href;
        const file = { path, uri, documentUser: TextDocument.create(uri, 'json', 0, '') };
        const project = Object.create(Project.prototype);
        Object.assign(project, { configFile: file, config: null, builds: [], statics: [],
            scssFiles: {}, onConfigSaveMutex: new Mutex() });
        return { file, project };
    };
    const first = make('first');
    const second = make('second');
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = { [first.file.uri]: first.project, [second.file.uri]: second.project };
    const save = async (entry, version, name) => {
        entry.file.documentUser = TextDocument.create(entry.file.uri, 'json', version,
            JSON.stringify({ module: entry === first ? 'First' : 'Second',
                build: [{ name, src: ['./src'] }] }));
        await entry.project.onConfigSave();
    };
    const source = entry => pathToFileURL(join(root, entry === first ? 'first' : 'second', 'src', 'item.lib.avt')).href;
    const names = uri => manager.getMatchingBuildsByUri(uri).map(build => build.fullname);

    await save(first, 1, 'old');
    await save(second, 1, 'stable');
    const firstOld = first.project.getBuilds()[0];
    const secondStable = second.project.getBuilds()[0];
    assert.deepEqual(names(source(first)), ['First@old']);
    assert.deepEqual(names(source(second)), ['Second@stable']);

    failFirst = true;
    await assert.rejects(save(first, 2, 'new'), /first initialization failed/);
    assert.deepEqual(manager.getAllBuilds(), [{ name: 'Second@stable', uri: second.file.uri }]);
    assert.deepEqual(names(source(first)), []);
    assert.deepEqual(names(source(second)), ['Second@stable']);
    assert.equal(second.project.getBuilds()[0], secondStable);
    assert.ok(destroyed.includes(firstOld));

    failFirst = false;
    await save(first, 3, 'new');
    assert.deepEqual(manager.getAllBuilds(), [
        { name: 'First@new', uri: first.file.uri },
        { name: 'Second@stable', uri: second.file.uri },
    ]);
    assert.deepEqual(names(source(first)), ['First@new']);
    assert.deepEqual(names(source(second)), ['Second@stable']);
    assert.equal(second.project.getBuilds()[0], secondStable);
});
