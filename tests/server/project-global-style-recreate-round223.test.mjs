import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { ProjectManager }, { FilesWatcher }, { GenericServer },
    { SettingsManager }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'project/ProjectManager.ts', 'files/FilesWatcher.ts',
    'GenericServer.ts', 'settings/Settings.ts', 'tools.ts',
]);

test('two projects replace a deleted global style without retaining its former file subscription', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-global-style-recreate-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const configPaths = ['one', 'two'].map(name => {
        const directory = join(root, name);
        mkdirSync(directory);
        const path = join(directory, 'aventus.conf.avt');
        writeFileSync(path, JSON.stringify({ module: name, build: [] }));
        return path;
    });
    const stylePath = join(root, 'theme.gs.avt');
    const styleUri = pathToUri(stylePath);
    const old = {
        files: FilesManager.instance, projects: ProjectManager.instance,
        autoLoad: ProjectManager.autoLoad, watcher: FilesWatcher.instance,
        server: GenericServer.instance, settings: SettingsManager.instance,
    };
    const manager = Object.create(FilesManager.prototype);
    manager.pendingRegistrations = new Map();
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false,
        onNewFileCb: {}, onFileRemoveCb: {} });
    FilesManager.instance = manager;
    ProjectManager.instance = undefined;
    ProjectManager.autoLoad = false;
    FilesWatcher.instance = { watch() {}, unwatch() {} };
    GenericServer.instance = { isIDE: false, logLevel: 99,
        connection: { sendDiagnostics() {} } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    t.after(() => {
        for (const timeout of Object.values(manager.lockedUpdatedUri)) clearTimeout(timeout);
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        FilesManager.instance = old.files;
        ProjectManager.instance = old.projects;
        ProjectManager.autoLoad = old.autoLoad;
        FilesWatcher.instance = old.watcher;
        GenericServer.instance = old.server;
        SettingsManager.instance = old.settings;
    });

    const projects = ProjectManager.getInstance();
    for (const path of configPaths) {
        await manager.registerFile(TextDocument.create(pathToUri(path), 'Aventus Ts', 1,
            JSON.stringify({ module: path.includes('one') ? 'one' : 'two', build: [] })));
    }
    const entries = configPaths.map(path => projects.getProjectByUri(pathToUri(path)));
    assert.ok(entries.every(Boolean));

    writeFileSync(stylePath, '$brand: red;');
    await manager.registerFile(TextDocument.create(styleUri, 'Aventus SCSS', 1, '$brand: red;'));
    const firstFile = manager.getByUri(styleUri);
    const firstStyles = entries.map(project => project.scssFiles[styleUri]);
    assert.ok(firstStyles.every(style => style?.file === firstFile));
    assert.notEqual(firstStyles[0], firstStyles[1]);

    await manager.registerFile(TextDocument.create(styleUri, 'Aventus SCSS', 2, '$brand: blue;'));
    for (let i = 0; i < entries.length; i++) {
        assert.equal(entries[i].scssFiles[styleUri], firstStyles[i]);
        assert.equal(Object.keys(entries[i].onFileDeleteUUIDs).length, 1);
    }

    await manager.onDeletedUri(styleUri);
    for (const project of entries) {
        assert.equal(project.scssFiles[styleUri], undefined);
        assert.deepEqual(project.onFileDeleteUUIDs, {});
    }

    writeFileSync(stylePath, '$brand: green;');
    await manager.registerFile(TextDocument.create(styleUri, 'Aventus SCSS', 3, '$brand: green;'));
    const secondFile = manager.getByUri(styleUri);
    assert.notEqual(secondFile, firstFile);
    for (let i = 0; i < entries.length; i++) {
        assert.equal(entries[i].scssFiles[styleUri]?.file, secondFile);
        assert.notEqual(entries[i].scssFiles[styleUri], firstStyles[i]);
        assert.equal(Object.keys(entries[i].onFileDeleteUUIDs).length, 1);
    }
});
