import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { ProjectManager }, { Build }, { Static }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { HttpServer }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/ProjectManager.ts', 'project/Build.ts', 'project/Static.ts',
    'settings/Settings.ts', 'GenericServer.ts', 'files/FilesManager.ts',
    'project/DependencyManager.ts', 'live-server/HttpServer.ts', 'Mutex.ts',
]);

test('static selection changes from empty to one to all without routing excluded entries', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-selection-round188-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const old = {
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
    Build.prototype.init = async function () {};
    t.after(() => {
        SettingsManager.instance = old.settings;
        GenericServer.instance = old.server;
        FilesManager.instance = old.files;
        DependencyManager.instance = old.dependency;
        HttpServer.getInstance = old.http;
        Build.prototype.init = old.init;
    });

    for (const name of ['images', 'fonts']) {
        mkdirSync(join(root, name));
        writeFileSync(join(root, name, `${name}.txt`), `first-${name}`);
    }
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const file = { path, uri, documentUser: TextDocument.create(uri, 'json', 0, '') };
    for (const event of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        file[`removeOn${event}`] = () => {};
    }
    const project = Object.create(Project.prototype);
    Object.assign(project, { configFile: file, config: null, builds: [], statics: [], scssFiles: {},
        staticsAllowed: [], onConfigSaveMutex: new Mutex() });
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = { [uri]: project };
    const save = async version => {
        file.documentUser = TextDocument.create(uri, 'json', version, JSON.stringify({
            module: 'Demo', build: [{ name: 'web', src: [] }],
            static: ['images', 'fonts'].map(name => ({
                name, input: `./${name}`, output: `./dist/${name}`,
            })),
        }));
        await project.onConfigSave();
    };
    const choices = names => names.map(name => ({ name, uri }));

    await save(1);
    assert.ok(project.getConfig(), 'configuration must parse');
    assert.equal(project.getConfig().static.length, 2);
    assert.deepEqual(project.getStaticsName(), []);
    assert.deepEqual(manager.getAllStatics(), []);
    assert.equal(existsSync(join(root, 'dist')), false);

    project.staticsAllowed = ['fonts'];
    await save(2);
    assert.deepEqual(project.getStaticsName(), ['fonts']);
    assert.deepEqual(manager.getAllStatics(), choices(['fonts']));
    assert.equal(project.getStatic('images'), undefined);
    assert.ok(project.getStatic('fonts') instanceof Static);
    assert.equal(readFileSync(join(root, 'dist', 'fonts', 'fonts.txt'), 'utf8'), 'first-fonts');
    assert.equal(existsSync(join(root, 'dist', 'images')), false);

    project.staticsAllowed = undefined;
    writeFileSync(join(root, 'fonts', 'fonts.txt'), 'second-fonts');
    await save(3);
    assert.deepEqual(project.getStaticsName(), ['images', 'fonts']);
    assert.deepEqual(manager.getAllStatics(), choices(['images', 'fonts']));
    assert.equal(readFileSync(join(root, 'dist', 'images', 'images.txt'), 'utf8'), 'first-images');
    assert.equal(readFileSync(join(root, 'dist', 'fonts', 'fonts.txt'), 'utf8'), 'second-fonts');
    assert.equal(project.getStatic('missing'), undefined);

    project.destroy();
});
