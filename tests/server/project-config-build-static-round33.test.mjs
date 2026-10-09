import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { Build }, { Static }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { HttpServer }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'project/Static.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'files/FilesManager.ts', 'project/DependencyManager.ts',
    'live-server/HttpServer.ts', 'Mutex.ts',
]);

test('a saved project config creates builds and static exports, then reloads their lists and output', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.project-config-round33-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const input = join(root, 'public');
    mkdirSync(input);
    writeFileSync(join(input, 'asset.txt'), 'asset one');
    const uri = pathToFileURL(join(root, 'aventus.conf.avt')).href;
    const previous = {
        settings: SettingsManager.instance, server: GenericServer.instance,
        files: FilesManager.instance, dependency: DependencyManager.instance,
        http: HttpServer.getInstance, init: Build.prototype.init,
    };
    const events = [];
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
    HttpServer.getInstance = () => ({ reload: () => {} });
    Build.prototype.init = async function () { events.push(['init', this.fullname]); this.initDone = true; };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        HttpServer.getInstance = previous.http;
        Build.prototype.init = previous.init;
    });

    const configFile = {
        uri, path: join(root, 'aventus.conf.avt'),
        documentUser: TextDocument.create(uri, 'json', 1, ''),
    };
    for (const name of ['Save', 'Validate', 'Formatting', 'Completion', 'CompletionResolve', 'Hover']) {
        configFile[`removeOn${name}`] = () => {};
    }
    const project = Object.create(Project.prototype);
    project.configFile = configFile;
    project.config = null;
    project.builds = [];
    project.statics = [];
    project.scssFiles = {};
    project.onConfigSaveMutex = new Mutex();
    const save = async (version, builds, statics) => {
        configFile.documentUser = TextDocument.create(uri, 'json', version, JSON.stringify({
            module: 'Demo', build: builds.map(name => ({ name, src: [] })),
            static: statics.map(name => ({ name, input: './public', output: `./dist/${name}` })),
        }));
        await project.onConfigSave();
    };

    await save(1, ['first', 'second'], ['images', 'fonts']);
    assert.deepEqual(project.getBuildsName(), ['Demo@first', 'Demo@second']);
    assert.deepEqual(project.getStaticsName(), ['images', 'fonts']);
    assert.ok(project.getBuild('Demo@first') instanceof Build);
    assert.ok(project.getStatic('images') instanceof Static);
    assert.equal(readFileSync(join(root, 'dist', 'images', 'asset.txt'), 'utf8'), 'asset one');
    assert.equal(readFileSync(join(root, 'dist', 'fonts', 'asset.txt'), 'utf8'), 'asset one');

    writeFileSync(join(input, 'asset.txt'), 'asset two');
    await save(2, ['third'], ['media']);
    assert.deepEqual(project.getBuildsName(), ['Demo@third']);
    assert.deepEqual(events, [['init', 'Demo@first'], ['init', 'Demo@second'], ['init', 'Demo@third']]);
    assert.equal(readFileSync(join(root, 'dist', 'media', 'asset.txt'), 'utf8'), 'asset two');
    // Existing Static instances remain in the collection after configuration reload.
    assert.deepEqual(project.getStaticsName(), ['images', 'fonts', 'media']);
    configFile.documentUser = TextDocument.create(uri, 'json', 3, '{ invalid');
    await project.onConfigSave();
    assert.equal(project.getConfig(), null);
    assert.deepEqual(project.getBuildsName(), []);
    assert.deepEqual(project.getStaticsName(), ['images', 'fonts', 'media']);
    writeFileSync(join(input, 'asset.txt'), 'asset three');
    await project.buildAll();
    assert.equal(readFileSync(join(root, 'dist', 'images', 'asset.txt'), 'utf8'), 'asset three');
    assert.equal(readFileSync(join(root, 'dist', 'fonts', 'asset.txt'), 'utf8'), 'asset three');
    assert.equal(readFileSync(join(root, 'dist', 'media', 'asset.txt'), 'utf8'), 'asset three');
    project.destroy();
});
