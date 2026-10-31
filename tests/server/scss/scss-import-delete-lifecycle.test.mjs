import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusWebSCSSFile }, { InternalAventusFile }, { FilesManager }, { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'language-services/scss/File.ts',
    'files/AventusFile.ts',
    'files/FilesManager.ts',
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
    'GenericServer.ts',
    'settings/Settings.ts',
]);

test('deleting an imported SCSS partial refreshes its consumer and clears stale CSS', async t => {
    const rootUri = 'file:///D:/round134/panel.wcs.avt';
    const partialUri = 'file:///D:/round134/_tokens.wcs.avt';
    const root = new InternalAventusFile(TextDocument.create(rootUri, 'scss', 1,
        '@import "tokens"; .panel { color: $accent; }'));
    const partial = new InternalAventusFile(TextDocument.create(partialUri, 'scss', 1, '$accent: red;'));
    const byPath = new Map([root, partial].map(file => [file.path.replace(/\\/g, '/'), file]));
    const previousManager = FilesManager.getInstance;
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    const diagnostics = [];
    FilesManager.getInstance = () => ({ getByPath: path => byPath.get(path.replace(/\\/g, '/')) });
    GenericServer.instance = { logLevel: 0, connection: { sendDiagnostics: params => diagnostics.push(params) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    t.after(() => {
        FilesManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
        clearTimeout(root.delayValidate);
        clearTimeout(partial.delayValidate);
    });
    const build = {
        buildConfig: { fullname: 'round134' },
        scssFiles: {}, htmlFiles: {}, tsFiles: {}, diagnostics: new Map(), hideWarnings: false,
        project: { resolveAlias: value => value },
        getNamespace: () => '',
    };
    build.globalSCSSLanguageService = new AventusGlobalSCSSLanguageService();
    build.scssLanguageService = new AventusSCSSLanguageService(build);
    const component = new AventusWebSCSSFile(root, build);
    build.scssFiles[rootUri] = component;
    await component.init();
    assert.equal(component.compileResult, '.panel{color:red}');
    assert.ok(build.scssFiles[partialUri]);

    await partial.triggerContentChange(TextDocument.create(partialUri, 'scss', 2, '$accent: blue;'));
    await partial.triggerSave();
    for (let attempt = 0; attempt < 30 && component.compileResult !== '.panel{color:blue}'; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.equal(component.compileResult, '.panel{color:blue}');

    byPath.delete(partial.path.replace(/\\/g, '/'));
    await partial.triggerDelete();
    assert.equal(partial.isDeleted, true);
    assert.equal(component.compileResult, '');
    assert.equal(build.scssFiles[partialUri], undefined);
    assert.equal(Object.hasOwn(component.dependencies, partialUri), false);
    assert.equal(diagnostics.some(item => item.uri === rootUri && item.diagnostics.some(diagnostic => diagnostic.message === "Can't load this file")), true);
});
