import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { AventusHTMLLanguageService }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/html/LanguageService.ts',
]);

function service() {
    const html = Object.create(AventusHTMLLanguageService.prototype);
    html.extenalDocumentation = {};
    html.internalDocumentation = {};
    html.internalDocumentationReverse = {};
    html.internalTagUri = {};
    html._allowRebuildDefinition = true;
    html.rebuildDefinition();
    html.languageService = getLanguageService({ customDataProviders: [html.defaultProvider()] });
    return html;
}

test('block name values follow the current view slots and discard stale view state', async () => {
    const html = service();
    const source = '<block name=""></block>';
    const documentUser = TextDocument.create('file:///round27.html.avt', 'Aventus HTML', 1, source);
    const file = { file: { documentUser }, slotsInfo: { header: { doc: 'Header slot' }, footer: { doc: 'Footer slot' } }, fileParsed: null };
    const position = documentUser.positionAt(source.indexOf('name="') + 6);
    const result = await html.doComplete(file, position);
    assert.ok(result.items.some(item => item.label === 'header'));
    assert.ok(result.items.some(item => item.label === 'footer'));
    assert.deepEqual(html.provideValues('block', 'name'), []);
});
