import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
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

test('same named static choices remain project scoped through replacement and invalidation', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-choices-round184-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const old = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        http: HttpServer.getInstance, init: Build.prototype.init,
        export: Static.prototype.export, destroy: Static.prototype.destroy,
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
    const events = [];
    Static.prototype.export = async function () {
        events.push(`export:${this.project.configFile.uri}:${this.name}`);
    };
    Static.prototype.destroy = function () {
        events.push(`destroy:${this.project.configFile.uri}:${this.name}`);
    };
    t.after(() => {
        SettingsManager.instance = old.settings;
        GenericServer.instance = old.server;
        FilesManager.instance = old.files;
        DependencyManager.instance = old.dependency;
        HttpServer.getInstance = old.http;
        Build.prototype.init = old.init;
        Static.prototype.export = old.export;
        Static.prototype.destroy = old.destroy;
    });

    const create = name => {
        const folder = join(root, name);
        mkdirSync(folder);
        mkdirSync(join(folder, 'public'));
        writeFileSync(join(folder, 'public', 'asset.txt'), name);
        const path = join(folder, 'aventus.conf.avt');
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
    const save = async (entry, version, names) => {
        const content = names === null ? '{ invalid' : JSON.stringify({
            module: 'Same', build: [{ name: 'web', src: [] }], static: names.map(name => ({
                name, input: './public', output: `./dist/${name}`,
            })),
        });
        entry.file.documentUser = TextDocument.create(entry.file.uri, 'json', version, content);
        await entry.project.onConfigSave();
    };
    const choice = (entry, name) => ({ name, uri: entry.file.uri, index: 0 });

    await save(first, 1, ['assets']);
    await save(second, 1, ['assets']);
    assert.ok(first.project.config, 'first project configuration should parse');
    assert.ok(second.project.config, 'second project configuration should parse');
    assert.deepEqual(manager.getAllStatics(), [choice(first, 'assets'), choice(second, 'assets')]);
    const secondMedia = second.project.getStatic('assets');
    assert.notEqual(first.project.getStatic('assets'), secondMedia);

    await save(first, 2, ['images']);
    assert.deepEqual(manager.getAllStatics(), [choice(first, 'images'), choice(second, 'assets')]);
    assert.equal(first.project.getStatic('assets'), undefined);
    assert.equal(second.project.getStatic('assets'), secondMedia);

    await save(first, 3, null);
    assert.deepEqual(manager.getAllStatics(), [choice(second, 'assets')]);
    assert.equal(second.project.getStatic('assets'), secondMedia);
    assert.deepEqual(events, [
        `export:${first.file.uri}:assets`, `export:${second.file.uri}:assets`,
        `destroy:${first.file.uri}:assets`, `export:${first.file.uri}:images`,
        `destroy:${first.file.uri}:images`,
    ]);
    first.project.destroy();
    second.project.destroy();
});
