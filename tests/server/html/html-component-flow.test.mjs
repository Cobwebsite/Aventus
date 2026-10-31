import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('component tags and named slots survive an if/else branch inside a loop', () => {
    const uri = 'file:///D:/test/html-component-flow-round141.html.avt';
    const source = 'for (const item of items) { if (item.active) { <demo-card :title="item.name"><slot name="header">{{item.name}}</slot></demo-card> } else { <demo-card title="Inactive"><slot name="body">Empty</slot></demo-card> } }';
    const file = { uri, versionUser: 1, documentUser: TextDocument.create(uri, 'aventus-html', 1, source) };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parsed = ParserHtml.parse(view, build);

    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.loops.length, 1);
    assert.equal(parsed.ifs.length, 1);
    assert.deepEqual(parsed.ifs[0].conditions.map(condition => condition.type), ['if']);
    assert.equal(parsed.tags.filter(tag => tag.tagName === 'demo-card').length, 2);
    assert.deepEqual(parsed.tags.filter(tag => tag.tagName === 'slot').map(tag => tag.attributes.name.value), ['header', 'body']);
    assert.deepEqual(parsed.injections.map(injection => injection.injectTsTxt), ['item.name']);
    assert.match(parsed.compiledTxt, /<l id="\d+">.*<if id="\d+">.*<demo-card.*<slot.*<\/demo-card>.*<\/if>.*<\/l>/);
});
