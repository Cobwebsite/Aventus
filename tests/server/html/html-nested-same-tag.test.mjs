import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('nested components with the same tag keep each attribute and closing tag after revisions', () => {
    const uri = `file:///D:/round248/nested-same-tag-${process.pid}.html.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const firstSource = '<demo-card :title="outer"><demo-card :title="inner"><slot name="leaf">Leaf</slot></demo-card><slot name="tail">Tail</slot></demo-card>';
    const first = parse(firstSource);
    assert.deepEqual(first.errors, []);
    assert.deepEqual(first.tags.map(tag => tag.tagName), ['demo-card', 'demo-card', 'slot', 'slot']);
    assert.deepEqual(first.injections.map(item => item.injectTsTxt), ['outer', 'inner']);
    assert.deepEqual(first.tags.filter(tag => tag.tagName === 'slot').map(tag => tag.attributes.name.value), ['leaf', 'tail']);
    for (const injection of first.injections) {
        assert.equal(firstSource.slice(injection.start, injection.end), `"${injection.injectTsTxt}"`);
    }

    const secondSource = '\r\n<demo-card :title="replacement"><slot name="only">One</slot></demo-card>';
    const second = parse(secondSource);
    assert.deepEqual(second.errors, []);
    assert.deepEqual(second.tags.map(tag => tag.tagName), ['demo-card', 'slot']);
    assert.deepEqual(second.injections.map(item => item.injectTsTxt), ['replacement']);
    assert.equal(secondSource.slice(second.injections[0].start, second.injections[0].end), '"replacement"');
    assert.deepEqual(second.tags.filter(tag => tag.tagName === 'slot').map(tag => tag.attributes.name.value), ['only']);
    assert.doesNotMatch(second.compiledTxt, /outer|inner|leaf|tail/);
});
