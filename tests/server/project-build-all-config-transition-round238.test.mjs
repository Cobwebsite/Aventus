import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { ProjectManager }, { Build }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { HttpServer }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/ProjectManager.ts', 'project/Build.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'files/FilesManager.ts', 'project/DependencyManager.ts',
    'live-server/HttpServer.ts', 'Mutex.ts',
]);

test('global build spans a project config replacement while next build uses new instances', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-project-build-transition-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        http: HttpServer.getInstance, init: Build.prototype.init,
        destroy: Build.prototype.destroy, build: Build.prototype.build,
    };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        HttpServer.getInstance = previous.http;
        Build.prototype.init = previous.init;
        Build.prototype.destroy = previous.destroy;
        Build.prototype.build = previous.build;
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
    HttpServer.getInstance = () => ({ reload: () => {} });

    const calls = [];
    let releaseOld;
    Build.prototype.init = async function () { calls.push(`init:${this.fullname}`); };
    Build.prototype.destroy = function () { calls.push(`destroy:${this.fullname}`); };
    Build.prototype.build = function () {
        calls.push(`build:${this.fullname}`);
        if (this.fullname === 'Module@old') return new Promise(resolve => { releaseOld = resolve; });
        return Promise.resolve();
    };

    const dir = join(root, 'project');
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
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = { [uri]: project };
    const save = async (version, buildName) => {
        file.documentUser = TextDocument.create(uri, 'json', version,
            JSON.stringify({ module: 'Module', build: [{ name: buildName, src: [] }] }));
        await project.onConfigSave();
    };

    await save(1, 'old');
    const oldBuild = project.builds[0];
    const pending = manager.buildAll();
    assert.deepEqual(calls.slice(-1), ['build:Module@old']);
    await save(2, 'new');
    assert.notEqual(project.builds[0], oldBuild);
    assert.ok(calls.includes('destroy:Module@old'));
    await manager.buildAll();
    assert.deepEqual(calls.filter(call => call.startsWith('build:')), [
        'build:Module@old', 'build:Module@new',
    ]);
    releaseOld();
    await pending;
    project.destroy();
});
