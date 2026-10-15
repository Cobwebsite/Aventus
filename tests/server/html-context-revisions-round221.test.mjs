import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('les éditions successives de contexte HTML renouvellent mapping, expression et plages', () => {
    const uri = `file:///D:/test/html-context-round221-${process.pid}.wcv.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const firstSource = '@Context("theme", currentTheme)\n<div>{{title}}</div>';
    const first = parse(firstSource);
    assert.equal(first.contextEdits.length, 1);
    assert.equal(firstSource.slice(first.contextEdits[0].start, first.contextEdits[0].end), '@Context("theme", currentTheme)');
    assert.deepEqual(first.contextEdits[0].mapping, ['"theme"', 'currentTheme']);
    assert.equal(first.contextEdits[0].typeToLoad[0].txt, 'theme');

    const secondSource = '\n<section>@Context("locale", selectedLocale)<span>{{message}}</span>@Context("theme", alternateTheme)</section>';
    const second = parse(secondSource);
    assert.equal(second.contextEdits.length, 2);
    assert.equal(secondSource.slice(second.contextEdits[0].start, second.contextEdits[0].end), '@Context("locale", selectedLocale)');
    assert.deepEqual(second.contextEdits[0].mapping, ['"locale"', 'selectedLocale']);
    assert.equal(second.contextEdits[0].typeToLoad[0].txt, 'locale');
    assert.equal(secondSource.slice(second.contextEdits[1].start, second.contextEdits[1].end), '@Context("theme", alternateTheme)');
    assert.deepEqual(second.contextEdits[1].mapping, ['"theme"', 'alternateTheme']);
    assert.notEqual(second.contextEdits[0].id, second.contextEdits[1].id);

    const thirdSource = '<section>@Context("locale", finalLocale)<span>{{message}}</span></section>';
    const third = parse(thirdSource);
    assert.equal(third.contextEdits.length, 1);
    assert.equal(thirdSource.slice(third.contextEdits[0].start, third.contextEdits[0].end), '@Context("locale", finalLocale)');
    assert.deepEqual(third.contextEdits[0].mapping, ['"locale"', 'finalLocale']);

    const fourth = parse('<section><span>{{message}}</span></section>');
    assert.deepEqual(fourth.contextEdits, []);
});
