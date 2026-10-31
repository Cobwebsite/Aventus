import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ParserHtml }, { AventusHTMLLanguageService }] = await loadServerModules([
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/LanguageService.ts',
]);

function fixture(source) {
    const uri = 'file:///round67-recovery.html.avt';
    const file = { uri, versionUser: 1, documentUser: TextDocument.create(uri, 'Aventus HTML', 1, source) };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const view = { file, tsFile: null, scssFile: null, build, fileParsed: null };
    const service = Object.create(AventusHTMLLanguageService.prototype);
    service.extenalDocumentation = {};
    service.internalDocumentation = {};
    service.internalDocumentationReverse = {};
    service.internalTagUri = {};
    service._allowRebuildDefinition = true;
    service.rebuildDefinition();
    service.languageService = getLanguageService({ customDataProviders: [service.defaultProvider()] });
    view.fileParsed = ParserHtml.parse(view, build);
    return { file, view, build, service };
}

function edit(state, source) {
    state.file.versionUser++;
    state.file.documentUser = TextDocument.create(state.file.uri, 'Aventus HTML', state.file.versionUser, source);
    state.view.fileParsed = ParserHtml.parse(state.view, state.build);
}

test('HTML completion and hover recover on the same file after a mismatched closing tag is repaired', async () => {
    const state = fixture('<div><span></div>');
    assert.ok(state.view.fileParsed.errors.length > 0);
    edit(state, '<div><span></span><a hr></a></div>');
    assert.deepEqual(state.view.fileParsed.errors, []);
    const source = state.file.documentUser.getText();
    const position = state.file.documentUser.positionAt(source.indexOf('hr') + 2);
    const completions = await state.service.doComplete(state.view, position);
    assert.ok(completions.items.some(item => item.label === 'href'));
    const hover = await state.service.doHover(state.view, state.file.documentUser.positionAt(source.indexOf('<a ') + 1));
    assert.ok(hover);
    assert.match(JSON.stringify(hover.contents), /anchor|hyperlink|href/i);
});

test('HTML formatting uses the repaired document rather than cached malformed markup', async () => {
    const state = fixture('<div><span></div>');
    edit(state, '<div><span>ok</span></div>');
    const doc = state.file.documentUser;
    const edits = await state.service.format(doc, { start: doc.positionAt(0), end: doc.positionAt(doc.getText().length) }, { tabSize: 2, insertSpaces: true });
    assert.ok(edits.length > 0);
    const formatted = edits.map(e => e.newText).join('');
    assert.match(formatted, /<span>ok<\/span>/);
    assert.doesNotMatch(formatted, /<span><\/div>/);
});
