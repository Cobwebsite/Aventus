import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('le cache HTML distingue les URI et renouvelle uniquement le document dont la version change', () => {
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const makeView = name => {
        const uri = `file:///D:/test/html-cache-round246-${process.pid}-${name}.html.avt`;
        const file = { uri, versionUser: 0, documentUser: null };
        return { file, tsFile: null, scssFile: null };
    };
    const update = (view, source) => {
        view.file.versionUser++;
        view.file.documentUser = TextDocument.create(view.file.uri, 'aventus-html', view.file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const firstView = makeView('first');
    const secondView = makeView('second');
    const first = update(firstView, '<div :title="first"></div>');
    const second = update(secondView, '<input @bind:value="second">');
    assert.equal(ParserHtml.getVersion(firstView), 1);
    assert.equal(ParserHtml.getVersion(secondView), 1);
    assert.strictEqual(ParserHtml.parse(firstView, build), first);
    assert.strictEqual(ParserHtml.parse(secondView, build), second);
    assert.deepEqual(first.injections.map(item => item.injectTsTxt), ['first']);
    assert.deepEqual(second.bindings.map(item => item.injectTsTxt), ['second']);

    const changed = update(firstView, '\n<section :title="updated"></section>');
    assert.notStrictEqual(changed, first);
    assert.strictEqual(ParserHtml.parse(secondView, build), second);
    assert.equal(ParserHtml.getVersion(firstView), 2);
    assert.equal(ParserHtml.getVersion(secondView), 1);
    assert.deepEqual(changed.injections.map(item => item.injectTsTxt), ['updated']);
    assert.deepEqual(changed.bindings, []);
    assert.deepEqual(second.bindings.map(item => item.injectTsTxt), ['second']);

    const repaired = update(secondView, '<p :title="final"></p>');
    assert.notStrictEqual(repaired, second);
    assert.strictEqual(ParserHtml.parse(firstView, build), changed);
    assert.deepEqual(repaired.injections.map(item => item.injectTsTxt), ['final']);
    assert.deepEqual(repaired.bindings, []);
});
