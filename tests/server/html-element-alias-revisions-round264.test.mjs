import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('@element property links follow alias changes and element removal across CRLF revisions', () => {
    const uri = `file:///D:/round264/element-alias-${process.pid}.html.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };
    const aliases = result => result.interestPoints.filter(point => point.type === 'property').map(point => point.name);

    const firstSource = '<div @element="header">Head</div>\r\n<span @element="footer">Foot</span>';
    const first = parse(firstSource);
    assert.deepEqual(first.errors, []);
    assert.deepEqual(aliases(first), ['header', 'footer']);
    for (const point of first.interestPoints.filter(item => item.type === 'property')) {
        assert.match(firstSource.slice(point.start, point.end), new RegExp(`@element="${point.name}"`));
    }

    const secondSource = '<p>Before</p>\r\n<span @element="title">Title</span>';
    const second = parse(secondSource);
    assert.deepEqual(second.errors, []);
    assert.deepEqual(aliases(second), ['title']);
    assert.equal(secondSource.slice(second.interestPoints.find(point => point.name === 'title').start,
        second.interestPoints.find(point => point.name === 'title').end), '@element="title"');

    const third = parse('<p>Plain</p>');
    assert.deepEqual(third.errors, []);
    assert.deepEqual(aliases(third), []);
});
