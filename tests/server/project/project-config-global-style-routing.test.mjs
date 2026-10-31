import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ FilesManager }, { ProjectManager }, { FilesWatcher }, { GenericServer }, { SettingsManager }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'project/ProjectManager.ts', 'files/FilesWatcher.ts',
    'GenericServer.ts', 'settings/Settings.ts', 'tools.ts',
]);

test('a project routes its config and global style to their own handlers and removes them on deletion', async () => {
    const dir = mkdtempSync(join(process.cwd(), 'aventus-project-routing-'));
    const configPath = join(dir, 'aventus.conf.avt');
    const stylePath = join(dir, 'theme.gs.avt');
    const configUri = pathToUri(configPath);
    const styleUri = pathToUri(stylePath);
    const previous = [FilesManager.instance, ProjectManager.instance, ProjectManager.autoLoad,
        FilesWatcher.instance, GenericServer.instance, SettingsManager.instance];
    const manager = Object.create(FilesManager.prototype);
    manager.pendingRegistrations = new Map();
    Object.assign(manager, { files: {}, lockedUpdatedUri: {}, loadingInProgress: false,
        onNewFileCb: {}, onFileRemoveCb: {} });
    FilesManager.instance = manager;
    ProjectManager.instance = undefined;
    ProjectManager.autoLoad = false;
    FilesWatcher.instance = { watch() {}, unwatch() {} };
    GenericServer.instance = { isIDE: false, logLevel: 99, connection: { sendDiagnostics() {} } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    try {
        writeFileSync(configPath, '{"module":"Demo","build":[]}');
        writeFileSync(stylePath, '$brand: red;');
        const projects = ProjectManager.getInstance();
        await manager.registerFile(TextDocument.create(configUri, 'Aventus Ts', 1,
            '{"module":"Demo","build":[]}'));
        const project = projects.getProjectByUri(configUri);
        assert.ok(project);
        assert.equal(project.getConfigFile(), manager.getByUri(configUri));
        await manager.registerFile(TextDocument.create(styleUri, 'Aventus SCSS', 1, '$brand: red;'));
        assert.equal(project.scssFiles[styleUri]?.constructor.name.endsWith('AventusGlobalSCSSFile'), true);
        assert.equal(project.scssFiles[styleUri].file, manager.getByUri(styleUri));

        await manager.onDeletedUri(styleUri);
        assert.equal(project.scssFiles[styleUri], undefined);
        assert.equal(manager.getByUri(styleUri), undefined);
        await manager.onDeletedUri(configUri);
        assert.equal(projects.getProjectByUri(configUri), undefined);
        assert.equal(manager.getByUri(configUri), undefined);
    } finally {
        for (const timeout of Object.values(manager.lockedUpdatedUri)) clearTimeout(timeout);
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
        [FilesManager.instance, ProjectManager.instance, ProjectManager.autoLoad,
            FilesWatcher.instance, GenericServer.instance, SettingsManager.instance] = previous;
        rmSync(dir, { recursive: true, force: true });
    }
});
