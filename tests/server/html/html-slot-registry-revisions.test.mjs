import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-html-languageservice';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ ParserHtml }, { AventusHTMLLanguageService }] = await loadServerModules([
    'language-services/html/parser/ParserHtml.ts',
    'language-services/html/LanguageService.ts',
]);

test('slot completion follows registry and nested parent revisions on the same HTML view', async () => {
    const uri = 'file:///round279-slot-registry.html.avt';
    const file = { uri, versionUser: 0, documentUser: null };
    const definitions = {
        'outer-card': { class: 'Outer' },
        'inner-card': { class: 'Inner' },
    };
    const slots = {
        Outer: { header: { doc: 'Header slot' } },
        Inner: { icon: { doc: 'Icon slot' } },
    };
    const build = {
        getAvoidParsingTags: () => [],
        getWebComponentDefinition: tag => definitions[tag] ?? null,
        getSlotsInfo: cls => slots[cls] ?? {},
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

    async function completion(source, marker) {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'Aventus HTML', file.versionUser, source);
        view.fileParsed = ParserHtml.parse(view, build);
        const offset = source.indexOf(marker) + marker.length;
        assert.ok(offset >= marker.length, `missing ${marker}`);
        const result = await service.doComplete(view, file.documentUser.positionAt(offset));
        return new Set(result.items.map(item => item.label));
    }

    const first = await completion('<outer-card><span slot=""></span></outer-card>', 'slot="');
    assert.ok(first.has('header'));
    assert.ok(!first.has('icon'));

    slots.Outer = { footer: { doc: 'Footer slot' } };
    const second = await completion('<outer-card><span slot=""></span><inner-card><i slot=""></i></inner-card></outer-card>', 'span slot="');
    assert.ok(second.has('footer'));
    assert.ok(!second.has('header'));
    assert.ok(!second.has('icon'));

    const source = '<outer-card><span slot=""></span><inner-card><i slot=""></i></inner-card></outer-card>';
    const third = await completion(source, 'i slot="');
    assert.ok(third.has('icon'));
    assert.ok(!third.has('footer'));

    delete definitions['inner-card'];
    const fourth = await completion(source, 'i slot="');
    assert.ok(!fourth.has('icon'));
    assert.ok(!fourth.has('footer'));
});
