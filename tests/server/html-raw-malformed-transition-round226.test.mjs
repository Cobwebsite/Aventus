import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('malformed content in a raw tag becomes parsed after configuration changes, then recovers', () => {
    const uri = `file:///D:/round226/raw-malformed-${process.pid}.html.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    let rawTags = ['pre'];
    const build = { getAvoidParsingTags: () => rawTags, htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const malformed = '<section>\n<pre><button :title="hidden">broken</span></pre>\n<button :title="outside">ok</button>\n</section>';
    const ignored = parse(malformed);
    assert.deepEqual(ignored.errors, []);
    assert.deepEqual(ignored.injections.map(item => item.injectTsTxt), ['outside']);
    assert.equal(malformed.slice(ignored.injections[0].start, ignored.injections[0].end), '"outside"');

    rawTags = [];
    const exposed = parse(malformed);
    assert.ok(exposed.errors.some(error => error.message.includes("button isn't correctly closed")));
    assert.deepEqual(exposed.injections.map(item => item.injectTsTxt), ['hidden', 'outside']);
    for (const injection of exposed.injections) {
        assert.equal(malformed.slice(injection.start, injection.end), `"${injection.injectTsTxt}"`);
    }

    const repairedSource = '<section>\n<pre><button :title="repaired">fixed</button></pre>\n<button :title="after">ok</button>\n</section>';
    const repaired = parse(repairedSource);
    assert.deepEqual(repaired.errors, []);
    assert.deepEqual(repaired.injections.map(item => item.injectTsTxt), ['repaired', 'after']);
    assert.ok(!repaired.injections.some(item => item.injectTsTxt === 'hidden' || item.injectTsTxt === 'outside'));
});
