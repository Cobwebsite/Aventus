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

test('disk changes to one of two sources preserve the other source in build output', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-disk-multi-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const firstPath = join(root, 'first.lib.avt');
    const secondPath = join(root, 'second.lib.avt');
    const firstUri = pathToUri(firstPath);
    const secondUri = pathToUri(secondPath);
    const output = join(root, 'bundle.js');
    const prior = [GenericServer.instance, FilesWatcher.instance, SettingsManager.instance, DependencyManager.instance];
    const compiled = [];
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 99,
        connection: {
            delayBetweenBuild: () => 0,
            sendDiagnostics() {},
            sendNotification: (name, args) => compiled.push([name, args]),
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
            fullname: 'DiskMulti@web', module: 'DiskMulti', name: 'web', version: '1.0.0',
            srcPathRegex: /\.lib\.avt$/,
            compile: [{ output: [{ '@default': { path: output } }], package: [], outputNpm: { path: [], npmName: '', live: false } }],
        },
        diagnostics: new Map(), scssLanguageService: { getInternalDocumentation: () => ({}) },
        npmBuilder: { compile: async () => ({ result: '', errors: [] }) },
        tsFiles: {}, scssFiles: {}, htmlFiles: {}, wcFiles: {}, onFileDeleteUUIDs: {},
    });
    build.writeFile = async (path, content) => writeFileSync(path, content);
    build.buildOrderCompilationInfo = async () => ({
        toCompile: manager.getFilesMatching(/\.lib\.avt$/).map(file => file.contentUser),
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

    writeFileSync(firstPath, 'class First {}');
    await manager.onCreatedUri(firstUri);
    writeFileSync(secondPath, 'class Second {}');
    await manager.onCreatedUri(secondUri);
    assert.match(readFileSync(output, 'utf8'), /class First/);
    assert.match(readFileSync(output, 'utf8'), /class Second/);

    writeFileSync(firstPath, 'class Updated {}');
    await manager.onUpdatedUri(firstUri);
    const updated = readFileSync(output, 'utf8');
    assert.match(updated, /class Updated/);
    assert.match(updated, /class Second/);
    assert.doesNotMatch(updated, /class First/);

    unlinkSync(firstPath);
    await manager.onDeletedUri(firstUri);
    assert.equal(manager.getByUri(firstUri), undefined);
    assert.ok(manager.getByUri(secondUri));
    const afterDelete = readFileSync(output, 'utf8');
    assert.doesNotMatch(afterDelete, /class First|class Updated/);
    assert.match(afterDelete, /class Second/);

    writeFileSync(firstPath, 'class Recreated {}');
    await manager.onCreatedUri(firstUri);
    const recreated = readFileSync(output, 'utf8');
    assert.match(recreated, /class Recreated/);
    assert.match(recreated, /class Second/);
    assert.doesNotMatch(recreated, /class First|class Updated/);
    assert.equal(compiled.filter(([name]) => name === 'aventus/compiled').length, 5);
});
