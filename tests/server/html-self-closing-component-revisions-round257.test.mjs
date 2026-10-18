import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('self-closing components and following siblings retain separate bindings through revisions', () => {
    const uri = `file:///D:/round257/self-closing-${process.pid}.html.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const firstSource = '<demo-card :title="first"/><demo-card :title="second"/><p :title="tail">Tail</p>';
    const first = parse(firstSource);
    assert.deepEqual(first.errors, []);
    assert.deepEqual(first.tags.map(tag => tag.tagName), ['demo-card', 'demo-card', 'p']);
    assert.deepEqual(first.injections.map(item => item.injectTsTxt), ['first', 'second', 'tail']);
    for (const injection of first.injections) {
        assert.equal(firstSource.slice(injection.start, injection.end), `"${injection.injectTsTxt}"`);
    }

    const secondSource = '<demo-card :title="updated"/>\r\n<section :title="after">After</section>';
    const second = parse(secondSource);
    assert.deepEqual(second.errors, []);
    assert.deepEqual(second.tags.map(tag => tag.tagName), ['demo-card', 'section']);
    assert.deepEqual(second.injections.map(item => item.injectTsTxt), ['updated', 'after']);
    for (const injection of second.injections) {
        assert.equal(secondSource.slice(injection.start, injection.end), `"${injection.injectTsTxt}"`);
    }
    assert.doesNotMatch(second.compiledTxt, /first|second|tail/);
});
