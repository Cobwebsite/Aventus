import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ParserHtml }, { AventusHTMLLanguageService }] = await loadServerModules([
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/LanguageService.ts',
]);

test('slot value completion follows the parent component after an edit', async () => {
    const uri = 'file:///round76-slot.html.avt';
    const file = { uri, versionUser: 1, documentUser: null };
    const build = {
        getAvoidParsingTags: () => [],
        getWebComponentDefinition: tag => tag === 'first-card' ? { class: 'First' } : tag === 'second-card' ? { class: 'Second' } : null,
        getSlotsInfo: cls => cls === 'First'
            ? { header: { doc: 'Header' } }
            : cls === 'Second' ? { footer: { doc: 'Footer' } } : {},
    };
    const service = Object.create(AventusHTMLLanguageService.prototype);
    service.extenalDocumentation = {};
    service.internalDocumentation = {};
    service.internalDocumentationReverse = {};
    service.internalTagUri = {};
    service._allowRebuildDefinition = true;
    service.rebuildDefinition();
    service.languageService = getLanguageService({ customDataProviders: [service.defaultProvider()] });
    build.htmlLanguageService = service;
    const view = { file, build, tsFile: null, scssFile: null, fileParsed: null };

    async function values(source) {
        file.documentUser = TextDocument.create(uri, 'Aventus HTML', file.versionUser, source);
        view.fileParsed = ParserHtml.parse(view, build);
        const pos = file.documentUser.positionAt(source.indexOf('slot="') + 'slot="'.length);
        const result = await service.doComplete(view, pos);
        return result.items.map(item => item.label);
    }

    const first = await values('<first-card><span slot=""></span></first-card>');
    assert.ok(first.includes('header'));
    assert.ok(!first.includes('footer'));
    file.versionUser++;
    const second = await values('<second-card><span slot=""></span></second-card>');
    assert.ok(second.includes('footer'));
    assert.ok(!second.includes('header'));
    assert.deepEqual(service.provideValues('span', 'slot'), []);
});
