import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { ProjectManager }, { Build }, { SettingsManager }, { GenericServer },
    { FilesManager }, { DependencyManager }, { Mutex }] = await loadServerModules([
    'project/Project.ts', 'project/ProjectManager.ts', 'project/Build.ts', 'settings/Settings.ts',
    'GenericServer.ts', 'files/FilesManager.ts', 'project/DependencyManager.ts', 'Mutex.ts',
]);

test('alias revisions stay local to each project while shared-source routing follows config recovery', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-project-alias-round176-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    for (const folder of ['first', 'second', 'shared', 'first/old', 'first/new', 'second/private']) {
        mkdirSync(join(root, folder), { recursive: true });
    }
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
    Build.prototype.init = async function () { this.initDone = true; };
    Build.prototype.destroy = function () { destroyed.push(this); };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
        FilesManager.instance = previous.files;
        DependencyManager.instance = previous.dependency;
        Build.prototype.init = previous.init;
        Build.prototype.destroy = previous.destroy;
    });

    const create = folder => {
        const path = join(root, folder, 'aventus.conf.avt');
        const uri = pathToFileURL(path).href;
        const file = { path, uri, folderPath: join(root, folder),
            documentUser: TextDocument.create(uri, 'json', 0, '') };
        const project = Object.create(Project.prototype);
        Object.assign(project, { configFile: file, config: null, builds: [], statics: [],
            scssFiles: {}, onConfigSaveMutex: new Mutex() });
        return { file, project };
    };
    const first = create('first');
    const second = create('second');
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = { [first.file.uri]: first.project, [second.file.uri]: second.project };
    const save = async (entry, version, value) => {
        entry.file.documentUser = TextDocument.create(entry.file.uri, 'json', version,
            typeof value === 'string' ? value : JSON.stringify(value));
        await entry.project.onConfigSave();
    };
    const sharedUri = pathToFileURL(join(root, 'shared', 'model.lib.avt')).href;
    const owners = () => manager.getMatchingBuildsByUri(sharedUri).map(build => build.fullname);
    const resolve = entry => entry.project.resolveAlias('@code/item.lib.avt', join(root, 'shared'));

    await save(first, 1, { module: 'First', aliases: { '@code': './old' },
        build: [{ name: 'web', src: ['../shared'] }] });
    await save(second, 1, { module: 'Second', aliases: { '@code': './private' },
        build: [{ name: 'web', src: ['../shared'] }] });
    const firstInitial = first.project.getBuilds()[0];
    const secondInitial = second.project.getBuilds()[0];
    assert.deepEqual(owners(), ['First@web', 'Second@web']);
    assert.equal(resolve(first), '../first/old/item.lib.avt');
    assert.equal(resolve(second), '../second/private/item.lib.avt');

    await save(first, 2, { module: 'First', aliases: { '@code': './new' },
        build: [{ name: 'web', src: ['../shared'] }] });
    assert.deepEqual(owners(), ['First@web', 'Second@web']);
    assert.equal(resolve(first), '../first/new/item.lib.avt');
    assert.equal(resolve(second), '../second/private/item.lib.avt');
    assert.ok(destroyed.includes(firstInitial));
    assert.equal(destroyed.includes(secondInitial), false);

    await save(first, 3, '{ broken');
    assert.deepEqual(owners(), ['Second@web']);
    assert.equal(resolve(first), '@code/item.lib.avt');
    assert.equal(resolve(second), '../second/private/item.lib.avt');

    await save(first, 4, { module: 'First', aliases: { '@code': './old' },
        build: [{ name: 'web', src: ['../shared'] }] });
    assert.deepEqual(owners(), ['First@web', 'Second@web']);
    assert.equal(resolve(first), '../first/old/item.lib.avt');
    assert.equal(first.project.getBuilds().length, 1);
    assert.equal(second.project.getBuilds()[0], secondInitial);
});
