import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { DependencyManager }, { InternalAventusFile }, { GenericServer }, { TemplateFileManager }, { SettingsManager }, { FilesManager }, { AventusTsFileSelector }] = await loadServerModules([
    'project/Build.ts', 'project/DependencyManager.ts', 'files/AventusFile.ts', 'GenericServer.ts',
    'language-services/ts/template/TemplateFileManager.ts', 'settings/Settings.ts', 'files/FilesManager.ts',
    'language-services/ts/FileSelector.ts',
]);

function source(name, content = '') {
    return new InternalAventusFile(TextDocument.create(`file:///D:/routing/${name}`, 'Aventus Ts', 1, content));
}

function build() {
    const result = Object.create(Build.prototype);
    Object.assign(result, {
        tsFiles: {}, wcFiles: {}, htmlFiles: {}, scssFiles: {}, globalComponentSCSSFiles: {},
        i18nComponentsFiles: {}, onFileDeleteUUIDs: {},
        tsLanguageService: { addFile() {}, removeFile() {}, i18nFiles: {} },
        scssLanguageService: { removeInternalDefinition() {}, removeExternalDefinition() {} },
        htmlLanguageService: { removeInternalDefinition() {}, removeInternalTagUri() {}, removeExternalDefinition() {} },
        externalPackageInformation: { rebuild() {} }, npmBuilder: { unregister() {} },
        buildConfig: {}, project: { isCoreBuild: false },
        getNamespace: () => '', getComponentPrefix: () => 'demo', rebuildAll: async () => {},
    });
    return result;
}

test('the build chooses file classes by extension and excludes package, template, and unknown files', async () => {
    const previous = GenericServer.instance;
    GenericServer.instance = { logLevel: 99, isIDE: true, connection: { sendDiagnostics() {} } };
    const current = build();
    const expected = [
        ['wcl', 'AventusWebComponentLogicalFile', 'tsFiles'],
        ['wc', 'AventusWebComponentSingleFile', 'wcFiles'],
        ['data', 'AventusDataFile', 'tsFiles'],
        ['lib', 'AventusLibFile', 'tsFiles'],
        ['ram', 'AventusRamFile', 'tsFiles'],
        ['state', 'AventusStateFile', 'tsFiles'],
        ['static', 'AventusStaticFile', 'tsFiles'],
        ['def', 'AventusDefinitionFile', 'tsFiles'],
    ];
    const files = [];
    try {
        for (const [extension, className, cache] of expected) {
            const file = source(`same.${extension}.avt`);
            files.push(file);
            await current.registerFile(file, true);
            assert.equal(current[cache][file.uri]?.constructor.name.endsWith(className), true, extension);
            assert.equal(current.onFileDeleteUUIDs[file.uri] !== undefined, true, extension);
        }
        for (const [name, className, cache] of [
            ['same.wcs.avt', 'AventusWebSCSSFile', 'scssFiles'],
            ['same.wcv.avt', 'AventusHTMLFile', 'htmlFiles'],
            ['same.i18n.avt', 'AventusI18nFile', 'i18nComponentsFiles'],
            ['@global.i18n.avt', 'AventusI18nFile', null],
        ]) {
            const file = source(name, '{}');
            files.push(file);
            await current.registerFile(file, true);
            const selected = cache ? current[cache][file.uri] : current.tsLanguageService.i18nFiles[file.uri];
            assert.equal(selected?.constructor.name.endsWith(className), true, name);
            assert.equal(current.onFileDeleteUUIDs[file.uri] !== undefined, true, name);
        }
        for (const name of ['same.package.avt', 'template.avt.ts', 'same.wcl.avt.bak', 'same.wc.avt.bak', 'same.unknown']) {
            const file = source(name);
            await current.registerFile(file, true);
            assert.equal(current.tsFiles[file.uri], undefined, name);
            assert.equal(current.wcFiles[file.uri], undefined, name);
            assert.equal(current.htmlFiles[file.uri], undefined, name);
            assert.equal(current.scssFiles[file.uri], undefined, name);
            assert.equal(current.onFileDeleteUUIDs[file.uri], undefined, name);
        }
        assert.equal(Object.keys(current.tsFiles).length, 8);
        assert.equal(Object.keys(current.wcFiles).length, 1);
        assert.equal(Object.keys(current.htmlFiles).length, 1);
        assert.equal(Object.keys(current.scssFiles).length, 1);
    } finally {
        for (const file of files.toReversed()) await file.triggerDelete();
        GenericServer.instance = previous;
    }
});

test('template file is registered through FilesManager and handled outside the build', async () => {
    const previous = [GenericServer.instance, SettingsManager.instance, FilesManager.instance, TemplateFileManager.instance];
    const manager = Object.create(FilesManager.prototype);
    manager.pendingRegistrations = new Map();
    manager.files = {};
    manager.onNewFileCb = {};
    manager.loadingInProgress = false;
    FilesManager.instance = manager;
    TemplateFileManager.instance = undefined;
    GenericServer.instance = { _extensionPath: process.cwd(), logLevel: 99, isIDE: true,
        connection: { sendDiagnostics() {} } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    const uri = 'file:///D:/routing/template.avt.ts';
    try {
        TemplateFileManager.getInstance();
        await manager.triggerOnNewFile(TextDocument.create(uri, 'Aventus Ts', 1,
            'export default class Demo {}'));
        const file = manager.getByUri(uri);
        assert.ok(file);
        assert.equal(Object.keys(file.onGetBuildCb).length, 1);
        assert.equal(file.getBuild(), null);
        assert.equal(AventusTsFileSelector(file, build()), null);
    } finally {
        await manager.getByUri(uri)?.triggerDelete();
        [GenericServer.instance, SettingsManager.instance, FilesManager.instance, TemplateFileManager.instance] = previous;
    }
});

test('package and template scripts use their own handlers rather than build source-file classes', async () => {
    const previous = [GenericServer.instance, SettingsManager.instance];
    GenericServer.instance = { _extensionPath: process.cwd(), logLevel: 99, isIDE: true, connection: { sendDiagnostics() {} } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    const dependencyManager = Object.create(DependencyManager.prototype);
    dependencyManager.loadedPackages = {};
    const templateManager = Object.create(TemplateFileManager.prototype);
    const packageFile = source('same.package.avt', '// Demo@web:1.0.0\n//#region js def //\n//#endregion js def //');
    const templateFile = source('template.avt.ts', 'export default class Demo {}');
    try {
        const selected = dependencyManager.loadPackage(packageFile, build());
        assert.equal(selected?.constructor.name.endsWith('AventusPackageFile'), true);
        assert.equal(dependencyManager.loadedPackages['Demo@web'], selected);
        await templateManager.onNewFile(templateFile);
        assert.equal(Object.keys(templateFile.onGetBuildCb).length, 1);
        assert.equal(templateFile.getBuild(), null);
    } finally {
        await packageFile.triggerDelete();
        await templateFile.triggerDelete();
        [GenericServer.instance, SettingsManager.instance] = previous;
    }
});
