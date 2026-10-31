import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('multiline HTML comments suppress controls and bindings while neighboring live branches follow edits', () => {
    const uri = `file:///D:/round254/comment-controls-${process.pid}.html.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const firstSource = '<!--\r\nif (ghost) { <button :title="hidden" @click="discard()">x</button> }\r\n-->\r\nif (ready) { <button :title="visible" @click="open()">Go</button> }';
    const first = parse(firstSource);
    assert.deepEqual(first.errors, []);
    assert.deepEqual(first.ifs.map(item => item.conditions.map(condition => condition.txt)), [['ready']]);
    assert.deepEqual(first.injections.map(item => item.injectTsTxt), ['visible']);
    assert.equal(firstSource.slice(first.injections[0].start, first.injections[0].end), '"visible"');
    assert.equal(first.interestPoints.some(point => point.name === 'discard()'), false);
    assert.equal(first.interestPoints.some(point => point.name === 'open()'), true);

    const secondSource = '<!--\r\nfor (const ghost of ghosts) { <i :title="hidden">x</i> }\r\n-->\r\nfor (const item of items) { <button :title="item.name" @click="select(item)">Go</button> }';
    const second = parse(secondSource);
    assert.deepEqual(second.errors, []);
    assert.equal(second.ifs.length, 0);
    assert.deepEqual(second.loops.map(item => item.simple), [{ data: 'items', item: 'item' }]);
    assert.deepEqual(second.injections.map(item => item.injectTsTxt), ['item.name']);
    assert.equal(secondSource.slice(second.injections[0].start, second.injections[0].end), '"item.name"');
    assert.equal(second.interestPoints.some(point => point.name === 'select(item)'), true);
    assert.equal(second.interestPoints.some(point => point.name === 'open()'), false);

    const third = parse('<!-- if (ghost) { <i :title="hidden">x</i> } -->\r\n<p>Plain</p>');
    assert.deepEqual(third.errors, []);
    assert.equal(third.ifs.length, 0);
    assert.equal(third.loops.length, 0);
    assert.deepEqual(third.injections, []);
    assert.equal(third.interestPoints.some(point => point.name === 'select(item)'), false);
});
