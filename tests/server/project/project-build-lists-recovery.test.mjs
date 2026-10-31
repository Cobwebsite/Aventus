import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }, { ProjectManager }, { Build }, { Static }, { SettingsManager },
    { GenericServer }, { FilesManager }, { DependencyManager }, { HttpServer }, { Mutex }] =
    await loadServerModules([
        'project/Project.ts', 'project/ProjectManager.ts', 'project/Build.ts',
        'project/Static.ts', 'settings/Settings.ts', 'GenericServer.ts',
        'files/FilesManager.ts', 'project/DependencyManager.ts',
        'live-server/HttpServer.ts', 'Mutex.ts',
    ]);

test('global build and static choices recover after one project changes module name and repairs invalid config', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-choices-round204-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const old = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        http: HttpServer.getInstance, init: Build.prototype.init,
        export: Static.prototype.export,
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
    Build.prototype.init = async function () { this.initDone = true; };
    Static.prototype.export = async function () {};
    t.after(() => {
        SettingsManager.instance = old.settings;
        GenericServer.instance = old.server;
        FilesManager.instance = old.files;
        DependencyManager.instance = old.dependency;
        HttpServer.getInstance = old.http;
        Build.prototype.init = old.init;
        Static.prototype.export = old.export;
    });

    const create = name => {
        const dir = join(root, name);
        mkdirSync(dir);
        mkdirSync(join(dir, 'public'));
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
    const first = create('first');
    const second = create('second');
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = { [first.file.uri]: first.project, [second.file.uri]: second.project };
    const save = async (entry, version, module, build, staticNames) => {
        const content = module === null ? '{ invalid' : JSON.stringify({
            module, build, static: staticNames.map(name => ({
                name, input: './public', output: `./dist/${name}`,
            })),
        });
        entry.file.documentUser = TextDocument.create(entry.file.uri, 'json', version, content);
        await entry.project.onConfigSave();
    };
    const choice = (entry, name) => ({ name, uri: entry.file.uri });
    const staticChoice = (entry, name) => ({ name, uri: entry.file.uri, index: 0 });
    const story = { name: 'web', src: [], stories: { output: './stories' } };
    const npm = { name: 'web', src: [], compile: [{ outputNpm: './npm' }] };
    const plain = { name: 'plain', src: [] };

    await save(first, 1, 'Alpha', [story, plain], ['assets']);
    await save(second, 1, 'Beta', [npm], ['assets']);
    assert.deepEqual(manager.getAllBuilds(), [choice(first, 'Alpha@web'),
        choice(first, 'Alpha@plain'), choice(second, 'Beta@web')]);
    assert.deepEqual(manager.getAllBuildsWithStory(), [choice(first, 'Alpha@web')]);
    assert.deepEqual(manager.getAllBuildsWithNpm(), [choice(first, 'Alpha@web'),
        choice(second, 'Beta@web')]);
    assert.deepEqual(manager.getAllStatics(), [staticChoice(first, 'assets'), staticChoice(second, 'assets')]);

    await save(first, 2, 'Gamma', [npm, { ...story, name: 'story', disabled: true }], ['media']);
    assert.deepEqual(manager.getAllBuilds(), [choice(first, 'Gamma@web'), choice(second, 'Beta@web')]);
    assert.deepEqual(manager.getAllBuildsWithStory(), []);
    assert.deepEqual(manager.getAllBuildsWithNpm(), [choice(first, 'Gamma@web'),
        choice(second, 'Beta@web')]);
    assert.deepEqual(manager.getAllStatics(), [staticChoice(first, 'media'), staticChoice(second, 'assets')]);

    await save(first, 3, null, [], []);
    assert.deepEqual(manager.getAllBuilds(), [choice(second, 'Beta@web')]);
    assert.deepEqual(manager.getAllBuildsWithNpm(), [choice(second, 'Beta@web')]);
    assert.deepEqual(manager.getAllStatics(), [staticChoice(second, 'assets')]);

    await save(first, 4, 'Delta', [story], ['images']);
    assert.deepEqual(manager.getAllBuilds(), [choice(first, 'Delta@web'), choice(second, 'Beta@web')]);
    assert.deepEqual(manager.getAllBuildsWithStory(), [choice(first, 'Delta@web')]);
    assert.deepEqual(manager.getAllBuildsWithNpm(), [choice(first, 'Delta@web'),
        choice(second, 'Beta@web')]);
    assert.deepEqual(manager.getAllStatics(), [staticChoice(first, 'images'), staticChoice(second, 'assets')]);
    first.project.destroy();
    second.project.destroy();
});
