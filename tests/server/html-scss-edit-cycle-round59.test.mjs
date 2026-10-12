import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { AventusHTMLLanguageService }, { AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
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

test('HTML completion follows a component definition rename while a malformed view is repaired', async () => {
    const service = htmlService();
    const uri = 'file:///round59-view.wcv.avt';
    const definitionUri = 'file:///round59-component.wcl.avt';
    const define = name => ({ [name]: { name, class: 'Card', description: name, attributes: {} } });
    service.addInternalDefinition(definitionUri, define('demo-card'));

    const complete = async (source, version) => {
        const documentUser = TextDocument.create(uri, 'Aventus HTML', version, source);
        const file = { file: { uri, documentUser }, fileParsed: null };
        const result = await service.doComplete(file, documentUser.positionAt(source.length));
        return { documentUser, labels: result.items.map(item => item.label) };
    };

    const broken = await complete('<demo-', 1);
    assert.ok(broken.labels.includes('demo-card'));
    service.removeInternalDefinition(definitionUri);
    service.addInternalDefinition(definitionUri, define('demo-tile'));
    const renamed = await complete('<demo-', 2);
    assert.ok(renamed.labels.includes('demo-tile'));
    assert.ok(!renamed.labels.includes('demo-card'));

    const repaired = await complete('<demo-tile></demo-tile>', 3);
    const edits = await service.format(repaired.documentUser, null, { insertSpaces: true, tabSize: 2 });
    assert.ok(Array.isArray(edits));
    assert.match(TextDocument.applyEdits(repaired.documentUser, edits), /<demo-tile>/);
});

test('SCSS completion and formatting recover from malformed style after a global variable rename', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const themeUri = 'file:///round59-theme.scss.avt';
    const styleUri = 'file:///round59-style.wcs.avt';
    const theme = (version, text) => ({ file: { documentUser: TextDocument.create(themeUri, 'scss', version, text) } });
    const style = (version, text) => ({ documentUser: TextDocument.create(styleUri, 'scss', version, text) });
    global.loadVariables(theme(1, ':root { --accent: red; }'), themeUri);
    const broken = style(1, '.card { color: var(--accent);');
    assert.ok((await local.doValidation(broken)).length > 0);
    global.loadVariables(theme(2, ':root { --primary: blue; }'), themeUri);
    const repaired = style(2, '.card { color: var(--primary); }');
    assert.deepEqual(await local.doValidation(repaired), []);
    const position = repaired.documentUser.positionAt(repaired.documentUser.getText().indexOf('--primary') + 3);
    const labels = (await local.doComplete(repaired, position)).items.map(item => item.label);
    assert.ok(labels.includes('--primary'));
    assert.ok(!labels.includes('--accent'));
    assert.equal((await local.findDefinition(repaired, position))?.[0]?.uri, themeUri);
    const edits = await local.format(repaired, null, { insertSpaces: true, tabSize: 2 });
    assert.match(TextDocument.applyEdits(repaired.documentUser, edits), /--primary/);
});
