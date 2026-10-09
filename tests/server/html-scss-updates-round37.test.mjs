import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserHtml }, { AventusHTMLLanguageService }, { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/LanguageService.ts',
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
]);

function htmlService() {
    const service = Object.create(AventusHTMLLanguageService.prototype);
    service.extenalDocumentation = {};
    service.internalDocumentation = {};
    service.internalDocumentationReverse = {};
    service.internalTagUri = {};
    service._allowRebuildDefinition = true;
    service.rebuildDefinition();
    service.languageService = getLanguageService({ customDataProviders: [service.defaultProvider()] });
    return service;
}

test('HTML parser and LSP follow consecutive repairs and regressions of the same view', async () => {
    const service = htmlService();
    const uri = 'file:///round37-view.html.avt';
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: service };
    const file = { file: { uri }, build, tsFile: null, scssFile: null };
    const versions = [
        ['<div><span></div>', true],
        ['<div><span></span></div>', false],
        ['<div><span></div>', true],
    ];
    for (let index = 0; index < versions.length; index++) {
        const [source, broken] = versions[index];
        file.file.versionUser = index + 1;
        file.file.documentUser = TextDocument.create(uri, 'Aventus HTML', index + 1, source);
        file.fileParsed = ParserHtml.parse(file, build);
        assert.equal(file.fileParsed.errors.some(error => /span.*closed/.test(error.message)), broken);
        assert.deepEqual(await service.doValidation(file), []);
        const position = file.file.documentUser.positionAt(source.indexOf('div') + 1);
        const hover = await service.doHover(file, position);
        assert.ok(hover === null || typeof hover === 'object');
        const edits = await service.format(file.file.documentUser, null, { insertSpaces: true, tabSize: 2 });
        assert.ok(Array.isArray(edits));
    }
});

test('SCSS validation and hover reflect successive edits and a removed global variable', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const themeUri = 'file:///round37-theme.scss.avt';
    const componentUri = 'file:///round37-component.scss.avt';
    const theme = value => ({ file: { documentUser: TextDocument.create(themeUri, 'scss', 1, value) } });
    const component = (value, version) => ({ documentUser: TextDocument.create(componentUri, 'scss', version, value) });
    global.loadVariables(theme(':root { --accent: red; }'), themeUri);
    const valid = component('.card { color: var(--accent); }', 1);
    const position = valid.documentUser.positionAt(valid.documentUser.getText().indexOf('--accent') + 2);
    assert.deepEqual(await local.doValidation(valid), []);
    assert.match((await local.doHover(valid, position))?.contents?.value ?? '', /--accent: red/);
    const invalid = component('.card { color: var(--accent);', 2);
    assert.ok((await local.doValidation(invalid)).length > 0);
    const repaired = component('.card { color: var(--accent); }', 3);
    assert.deepEqual(await local.doValidation(repaired), []);
    global.removeVariables(themeUri);
    assert.equal(global.getDefinition('--accent'), undefined);
    assert.equal((await local.findDefinition(repaired, position))?.[0]?.uri, undefined);
});
