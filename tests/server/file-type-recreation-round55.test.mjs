import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { InternalAventusFile }, { GenericServer }, { AventusTsFileSelector }, { TemplateFileManager }, { SettingsManager }, { DependencyManager }] = await loadServerModules([
    'project/Build.ts', 'files/AventusFile.ts', 'GenericServer.ts', 'language-services/ts/FileSelector.ts',
    'language-services/ts/template/TemplateFileManager.ts', 'settings/Settings.ts', 'project/DependencyManager.ts',
]);

function source(uri) {
    return new InternalAventusFile(TextDocument.create(uri, 'Aventus Ts', 1, ''));
}

function build() {
    const current = Object.create(Build.prototype);
    Object.assign(current, {
        tsFiles: {}, wcFiles: {}, htmlFiles: {}, scssFiles: {}, globalComponentSCSSFiles: {},
        i18nComponentsFiles: {}, onFileDeleteUUIDs: {},
        tsLanguageService: { addFile() {}, removeFile() {}, i18nFiles: {} },
        scssLanguageService: { removeInternalDefinition() {}, removeExternalDefinition() {} },
        htmlLanguageService: { removeInternalDefinition() {}, removeInternalTagUri() {}, removeExternalDefinition() {} },
        externalPackageInformation: { rebuild() {} },
        npmBuilder: { unregister() {} }, buildConfig: {}, project: { isCoreBuild: false },
        getNamespace: () => '', getComponentPrefix: () => 'demo',
        rebuildAll: async () => {},
    });
    return current;
}

test('Build registers every TypeScript file family, removes its cache entry, then selects a fresh instance', async () => {
    const previous = GenericServer.instance;
    GenericServer.instance = { logLevel: 99, isIDE: true, connection: { sendDiagnostics() {} } };
    try {
        for (const extension of ['wcl', 'data', 'lib', 'ram', 'state', 'static', 'def']) {
            const uri = `file:///D:/round55/entry.${extension}.avt`;
            const current = build();
            const first = source(uri);
            await current.registerFile(first, true);
            const selected = current.tsFiles[uri];
            assert.ok(selected, extension);
            assert.equal(selected.file, first, extension);
            assert.equal(selected.constructor, AventusTsFileSelector(first, build()).constructor, extension);

            await first.triggerDelete();
            assert.equal(current.tsFiles[uri], undefined, extension);
            assert.equal(current.onFileDeleteUUIDs[uri], undefined, extension);

            const replacement = source(uri);
            await current.registerFile(replacement, true);
            assert.ok(current.tsFiles[uri], extension);
            assert.notEqual(current.tsFiles[uri], selected, extension);
            assert.equal(current.tsFiles[uri].file, replacement, extension);
            await replacement.triggerDelete();
        }
    } finally {
        GenericServer.instance = previous;
    }
});

test('dependency manager selects a package file and replaces its named cache entry on recreation', async () => {
    const previous = GenericServer.instance;
    GenericServer.instance = { logLevel: 99, isIDE: true, connection: { sendDiagnostics() {} } };
    const uri = 'file:///D:/round55/entry.package.avt';
    const content = '// Demo@web:1.0.0\n//#region js def //\n//#endregion js def //';
    const current = Object.create(DependencyManager.prototype);
    current.loadedPackages = {};
    const target = build();
    try {
        const first = new InternalAventusFile(TextDocument.create(uri, 'Aventus Ts', 1, content));
        const selected = current.loadPackage(first, target);
        assert.ok(selected);
        assert.equal(selected.constructor.name, 'AventusPackageFile');
        assert.equal(current.loadedPackages['Demo@web'], selected);
        await first.triggerDelete();
        assert.equal(current.loadedPackages['Demo@web'], selected);

        const replacement = new InternalAventusFile(TextDocument.create(uri, 'Aventus Ts', 2, content));
        const selectedAgain = current.loadPackage(replacement, target);
        assert.ok(selectedAgain);
        assert.notEqual(selectedAgain, selected);
        assert.equal(current.loadedPackages['Demo@web'], selectedAgain);
        await replacement.triggerDelete();
    } finally {
        GenericServer.instance = previous;
    }
});

test('template file manager attaches fresh language handlers after deleting and recreating a script', async () => {
    const uri = 'file:///D:/round55/template.avt.ts';
    const manager = Object.create(TemplateFileManager.prototype);
    const previous = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    GenericServer.instance = { _extensionPath: process.cwd(), logLevel: 99, isIDE: true, connection: { sendDiagnostics() {} } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    try {
        const first = source(uri);
        await manager.onNewFile(first);
        assert.equal(first.getBuild(), null);
        assert.equal(Object.keys(first.onGetBuildCb).length, 1);
        await first.triggerDelete();
        assert.deepEqual(first.getBuild(), []);
        assert.equal(Object.keys(first.onGetBuildCb).length, 0);

        const replacement = source(uri);
        await manager.onNewFile(replacement);
        assert.equal(replacement.getBuild(), null);
        assert.equal(Object.keys(replacement.onGetBuildCb).length, 1);
        await replacement.triggerDelete();
    } finally {
        GenericServer.instance = previous;
        SettingsManager.instance = previousSettings;
    }
});

test('Build routes a single component with embedded logic and recreates both cache entries after deletion', async () => {
    const previous = GenericServer.instance;
    GenericServer.instance = { logLevel: 99, isIDE: true, connection: { sendDiagnostics() {} } };
    const uri = 'file:///D:/round55/entry.wc.avt';
    const current = build();
    try {
        const first = source(uri);
        await current.registerFile(first, true);
        const selected = current.wcFiles[uri];
        assert.ok(selected);
        assert.equal(selected.file, first);
        assert.equal(current.tsFiles[uri], selected.logic);
        await first.triggerDelete();
        assert.equal(current.wcFiles[uri], undefined);
        assert.equal(current.tsFiles[uri], undefined);
        const replacement = source(uri);
        await current.registerFile(replacement, true);
        assert.ok(current.wcFiles[uri]);
        assert.notEqual(current.wcFiles[uri], selected);
        await replacement.triggerDelete();
    } finally {
        GenericServer.instance = previous;
    }
});
