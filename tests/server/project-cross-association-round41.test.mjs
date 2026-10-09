import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

test('neighboring projects retain independent and shared build membership through config reloads', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.project-association-round41-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    for (const dir of ['app/src', 'app-neighbor/src', 'common', 'app/public', 'app-neighbor/public']) {
        mkdirSync(join(root, dir), { recursive: true });
    }
    writeFileSync(join(root, 'app/public/asset.txt'), 'app asset');
    writeFileSync(join(root, 'app-neighbor/public/asset.txt'), 'neighbor asset');
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        http: HttpServer.getInstance, init: Build.prototype.init,
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
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        HttpServer.getInstance = previous.http;
        Build.prototype.init = previous.init;
    });

    const projects = ['app', 'app-neighbor'].map(folder => {
        const path = join(root, folder, 'aventus.conf.avt');
        const uri = pathToFileURL(path).href;
        const file = { uri, path, documentUser: TextDocument.create(uri, 'json', 0, '') };
        for (const name of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
            file[`removeOn${name}`] = () => {};
        }
        const project = Object.create(Project.prototype);
        Object.assign(project, { configFile: file, config: null, builds: [], statics: [],
            scssFiles: {}, onConfigSaveMutex: new Mutex() });
        return { folder, file, project };
    });
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = Object.fromEntries(projects.map(({ file, project }) => [file.uri, project]));
    const save = async (entry, version, includeCommon) => {
        const { folder, file, project } = entry;
        file.documentUser = TextDocument.create(file.uri, 'json', version, JSON.stringify({
            module: folder === 'app' ? 'App' : 'Neighbor',
            build: [{ name: 'web', src: includeCommon ? ['./src', '../common'] : ['./src'] }],
            static: [{ name: 'assets', input: './public', output: './dist/assets' }],
        }));
        await project.onConfigSave();
    };
    await save(projects[0], 1, true);
    await save(projects[1], 1, true);
    const matchingNames = path => manager.getMatchingBuildsByUri(pathToFileURL(join(root, path)).href)
        .map(build => build.fullname);
    assert.deepEqual(matchingNames('app/src/card.wcl.avt'), ['App@web']);
    assert.deepEqual(matchingNames('app-neighbor/src/card.wcl.avt'), ['Neighbor@web']);
    assert.deepEqual(matchingNames('common/shared.wcl.avt'), ['App@web', 'Neighbor@web']);
    assert.deepEqual(matchingNames('app-neighboring/src/card.wcl.avt'), []);
    assert.deepEqual(manager.getAllBuilds(), projects.map(({ file, folder }) =>
        ({ name: `${folder === 'app' ? 'App' : 'Neighbor'}@web`, uri: file.uri })));
    assert.equal(readFileSync(join(root, 'app/dist/assets/asset.txt'), 'utf8'), 'app asset');
    assert.equal(readFileSync(join(root, 'app-neighbor/dist/assets/asset.txt'), 'utf8'), 'neighbor asset');

    await save(projects[0], 2, false);
    assert.deepEqual(matchingNames('common/shared.wcl.avt'), ['Neighbor@web']);
    assert.deepEqual(matchingNames('app/src/card.wcl.avt'), ['App@web']);
    assert.deepEqual(matchingNames('app-neighbor/src/card.wcl.avt'), ['Neighbor@web']);
    for (const { project } of projects) project.destroy();
});
