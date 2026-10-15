import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('two raw regions move across revisions without hiding neighboring bindings', () => {
    const uri = `file:///D:/round224/raw-${process.pid}.html.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    let rawTags = ['pre', 'code'];
    const build = { getAvoidParsingTags: () => rawTags, htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const firstSource = '<section>\r\n<pre><button :title="hiddenPre">A</button></pre>\r\n<button :title="between">B</button>\r\n<code><button :title="hiddenCode">C</button></code>\r\n<button :title="after">D</button>\r\n</section>';
    const first = parse(firstSource);
    assert.deepEqual(first.tags.map(tag => tag.tagName), ['section', 'pre', 'button', 'code', 'button']);
    assert.deepEqual(first.injections.map(item => item.injectTsTxt), ['between', 'after']);
    assert.deepEqual(first.errors, []);

    rawTags = ['code'];
    const secondSource = '<section>\r\n<pre><button :title="exposedPre">A</button></pre>\r\n<code><button :title="hiddenCodeAgain">C</button></code>\r\n<button :title="newAfter">D</button>\r\n</section>';
    const second = parse(secondSource);
    assert.deepEqual(second.tags.map(tag => tag.tagName), ['section', 'pre', 'button', 'code', 'button']);
    assert.deepEqual(second.injections.map(item => item.injectTsTxt), ['exposedPre', 'newAfter']);
    assert.deepEqual(second.errors, []);

    rawTags = [];
    const thirdSource = '<section>\r\n<code><button :title="exposedCode">C</button></code>\r\n<button :title="last">D</button>\r\n</section>';
    const third = parse(thirdSource);
    assert.deepEqual(third.tags.map(tag => tag.tagName), ['section', 'code', 'button', 'button']);
    assert.deepEqual(third.injections.map(item => item.injectTsTxt), ['exposedCode', 'last']);
    assert.deepEqual(third.errors, []);
    for (const injection of third.injections) {
        assert.equal(thirdSource.slice(injection.start, injection.end), `"${injection.injectTsTxt}"`);
    }
});
