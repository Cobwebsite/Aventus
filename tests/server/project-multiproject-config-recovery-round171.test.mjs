import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { ProjectManager }, { Build }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { HttpServer }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/ProjectManager.ts', 'project/Build.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'files/FilesManager.ts', 'project/DependencyManager.ts',
    'live-server/HttpServer.ts', 'Mutex.ts',
]);

test('invalidating and repairing one project preserves the other project and renews its build choices', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-project-recovery-round171-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        http: HttpServer.getInstance, init: Build.prototype.init, destroy: Build.prototype.destroy,
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
    HttpServer.getInstance = () => ({ reload: () => {} });
    const events = [];
    Build.prototype.init = async function () { events.push(`init:${this.fullname}`); };
    Build.prototype.destroy = function () { events.push(`destroy:${this.fullname}`); };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        HttpServer.getInstance = previous.http;
        Build.prototype.init = previous.init;
        Build.prototype.destroy = previous.destroy;
    });

    const makeProject = folder => {
        const dir = join(root, folder);
        mkdirSync(dir);
        const path = join(dir, 'aventus.conf.avt');
        const uri = pathToFileURL(path).href;
        const file = { path, uri, documentUser: TextDocument.create(uri, 'json', 0, '') };
        for (const event of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
            file[`removeOn${event}`] = () => {};
        }
        const project = Object.create(Project.prototype);
        Object.assign(project, { configFile: file, config: null, builds: [], statics: [],
            scssFiles: {}, onConfigSaveMutex: new Mutex() });
        return { file, project };
    };
    const first = makeProject('first');
    const second = makeProject('second');
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = { [first.file.uri]: first.project, [second.file.uri]: second.project };
    const save = async (entry, version, value) => {
        entry.file.documentUser = TextDocument.create(entry.file.uri, 'json', version,
            typeof value === 'string' ? value : JSON.stringify(value));
        await entry.project.onConfigSave();
    };
    const choice = (entry, name) => ({ name, uri: entry.file.uri });

    await save(first, 1, { module: 'First', build: [{ name: 'story', src: [], stories: { output: './stories' } }] });
    await save(second, 1, { module: 'Second', build: [{ name: 'npm', src: [], compile: [{ outputNpm: './npm' }] }] });
    assert.deepEqual(manager.getAllBuilds(), [choice(first, 'First@story'), choice(second, 'Second@npm')]);
    assert.deepEqual(manager.getAllBuildsWithStory(), [choice(first, 'First@story')]);
    assert.deepEqual(manager.getAllBuildsWithNpm(), [choice(first, 'First@story'), choice(second, 'Second@npm')]);

    await save(first, 2, '{ broken');
    assert.deepEqual(manager.getAllBuilds(), [choice(second, 'Second@npm')]);
    assert.deepEqual(manager.getAllBuildsWithStory(), []);
    assert.deepEqual(manager.getAllBuildsWithNpm(), [choice(second, 'Second@npm')]);
    assert.equal(manager.getProjectByUri(first.file.uri), first.project);
    assert.equal(manager.getProjectByUri(second.file.uri), second.project);

    await save(second, 2, { module: 'Second', build: [{ name: 'plain', src: [] }] });
    await save(first, 3, { module: 'First', build: [{ name: 'repaired', src: [], stories: { output: './stories' } }] });
    assert.deepEqual(manager.getAllBuilds(), [choice(first, 'First@repaired'), choice(second, 'Second@plain')]);
    assert.deepEqual(manager.getAllBuildsWithStory(), [choice(first, 'First@repaired')]);
    assert.deepEqual(manager.getAllBuildsWithNpm(), [choice(first, 'First@repaired')]);
    assert.deepEqual(events, [
        'init:First@story', 'init:Second@npm',
        'destroy:First@story', 'destroy:Second@npm',
        'init:Second@plain', 'init:First@repaired',
    ]);

    first.project.destroy();
    second.project.destroy();
});
