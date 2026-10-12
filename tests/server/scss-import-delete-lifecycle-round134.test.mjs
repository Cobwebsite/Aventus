import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusWebSCSSFile }, { InternalAventusFile }, { FilesManager }, { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/scss/File.ts',
    'files/AventusFile.ts',
    'files/FilesManager.ts',
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
    'GenericServer.ts',
]);

test('SCSS imported partial edits propagate, then deletion leaves its consumer linked to a removed file', async t => {
    const rootUri = 'file:///D:/round134/panel.wcs.avt';
    const partialUri = 'file:///D:/round134/_tokens.wcs.avt';
    const root = new InternalAventusFile(TextDocument.create(rootUri, 'scss', 1,
        '@import "tokens"; .panel { color: $accent; }'));
    const partial = new InternalAventusFile(TextDocument.create(partialUri, 'scss', 1, '$accent: red;'));
    const byPath = new Map([root, partial].map(file => [file.path.replace(/\\/g, '/'), file]));
    const previousManager = FilesManager.getInstance;
    const previousServer = GenericServer.instance;
    FilesManager.getInstance = () => ({ getByPath: path => byPath.get(path.replace(/\\/g, '/')) });
    GenericServer.instance = { logLevel: 0, connection: { sendDiagnostics() {} } };
    t.after(() => {
        FilesManager.getInstance = previousManager;
        GenericServer.instance = previousServer;
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
    await assert.rejects(partial.triggerDelete(), TypeError);
    assert.equal(partial.isDeleted, true);
    assert.equal(component.compileResult, '.panel{color:blue}');
    assert.ok(build.scssFiles[partialUri]);
});
