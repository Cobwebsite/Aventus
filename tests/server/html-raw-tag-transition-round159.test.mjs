import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('une balise brute change de portée après modification de la configuration et du document', () => {
    const uri = 'file:///D:/round159/raw-tag.html.avt';
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    let rawTags = ['pre'];
    const build = { getAvoidParsingTags: () => rawTags, htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const first = parse('<section><pre><button :title="hidden">X</button></pre><button :title="visible">Y</button></section>');
    assert.deepEqual(first.injections.map(item => item.injectTsTxt), ['visible']);
    assert.deepEqual(first.tags.map(item => item.tagName), ['section', 'pre', 'button']);

    rawTags = [];
    const second = parse('<section><pre><button :title="nowVisible">X</button></pre><button :title="sibling">Y</button></section>');
    assert.deepEqual(second.injections.map(item => item.injectTsTxt), ['nowVisible', 'sibling']);
    assert.deepEqual(second.tags.map(item => item.tagName), ['section', 'pre', 'button', 'button']);

    rawTags = ['code'];
    const third = parse('<section><code><button :title="hiddenAgain">X</button></code><button :title="final">Y</button></section>');
    assert.deepEqual(third.injections.map(item => item.injectTsTxt), ['final']);
    assert.deepEqual(third.tags.map(item => item.tagName), ['section', 'code', 'button']);
    assert.deepEqual(third.errors, []);
});
