import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { FilesManager }, { GenericServer }, { FilesWatcher }, { SettingsManager }, { DependencyManager }, { pathToUri }] = await loadServerModules([
    'project/Build.ts', 'files/FilesManager.ts', 'GenericServer.ts', 'files/FilesWatcher.ts',
    'settings/Settings.ts', 'project/DependencyManager.ts', 'tools.ts',
]);

test('disk create and edit replace output; deletion removes the source in one rebuild', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-disk-round62-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const source = join(root, 'widget.lib.avt');
    const sourceUri = pathToUri(source);
    const output = join(root, 'bundle.js');
    const prior = [GenericServer.instance, FilesWatcher.instance, SettingsManager.instance, DependencyManager.instance];
    const notifications = [];
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 99,
        connection: {
            delayBetweenBuild: () => 0,
            sendDiagnostics() {},
            sendNotification: (name, args) => notifications.push([name, args]),
        },
    };
    FilesWatcher.instance = { watch() {}, unwatch() {} };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    DependencyManager.instance = { getPath: () => root };
    t.after(() => {
        [GenericServer.instance, FilesWatcher.instance, SettingsManager.instance, DependencyManager.instance] = prior;
    });

    const manager = Object.create(FilesManager.prototype);
    Object.assign(manager, {
        files: {}, lockedUpdatedUri: {}, loadingInProgress: false,
        onNewFileCb: {}, onFileRemoveCb: {},
    });
    t.after(() => {
        for (const file of Object.values(manager.files)) clearTimeout(file.delayValidate);
    });
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    Object.assign(build, {
        initDone: true, _allowBuild: true,
        buildConfig: {
            fullname: 'Disk@web', module: 'Disk', name: 'web', version: '1.0.0',
            srcPathRegex: /widget\.lib\.avt$/,
            compile: [{ output: [{ '@default': { path: output } }], package: [], outputNpm: { path: [], npmName: '', live: false } }],
        },
        diagnostics: new Map(), scssLanguageService: { getInternalDocumentation: () => ({}) },
        npmBuilder: { compile: async () => ({ result: '', errors: [] }) },
        tsFiles: {}, scssFiles: {}, htmlFiles: {}, wcFiles: {}, onFileDeleteUUIDs: {},
    });
    build.writeFile = async (path, content) => writeFileSync(path, content);
    build.buildOrderCompilationInfo = async () => ({
        toCompile: manager.getByUri(sourceUri) ? [manager.getByUri(sourceUri).contentUser] : [],
        libSrc: [], errors: [],
    });
    build.buildLocalCode = async files => ({
        codeNoNamespaceBefore: [], code: files, classesName: {}, codeNoNamespaceAfter: [], useDecorator: false,
        stylesheets: {}, htmlDoc: {}, doc: [], docNoNamespace: [], docInvisible: [],
        codeRenderInJs: [], codeNotRenderInJs: [],
    });
    build.registerFile = file => {
        build.tsFiles[file.uri] = { file };
        build.registerOnFileDelete(file);
        file.onSave(async () => build.build());
    };
    build.rebuildAll = async () => build.build();
    manager.onNewFile(build.onNewFile.bind(build));

    writeFileSync(source, 'class First {}');
    await manager.onCreatedUri(sourceUri);
    assert.match(readFileSync(output, 'utf8'), /class First/);
    assert.ok(build.tsFiles[sourceUri]);

    writeFileSync(source, 'class Second {}');
    await manager.onUpdatedUri(sourceUri);
    assert.match(readFileSync(output, 'utf8'), /class Second/);
    assert.doesNotMatch(readFileSync(output, 'utf8'), /class First/);

    unlinkSync(source);
    await manager.onDeletedUri(sourceUri);
    assert.equal(manager.getByUri(sourceUri), undefined);
    assert.equal(build.tsFiles[sourceUri], undefined);
    assert.equal(build.onFileDeleteUUIDs[sourceUri], undefined);
    assert.doesNotMatch(readFileSync(output, 'utf8'), /class First|class Second/);
    assert.equal(notifications.filter(([name]) => name === 'aventus/compiled').length, 3);
});
