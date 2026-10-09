import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');
let sequence = 0;

function fixture(content, version = 1, uri = `file:///cache-${++sequence}.html.avt`) {
    const documentUser = TextDocument.create(uri, 'aventus-html', version, content);
    return { file: { uri, versionUser: version, documentUser }, tsFile: null, scssFile: null };
}

const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };

test('HTML parser reuses the result for an unchanged version and reparses a changed version', () => {
    const first = fixture('<div>First</div>');
    assert.equal(ParserHtml.getVersion(first), 0);
    const parsedFirst = ParserHtml.parse(first, build);
    assert.equal(ParserHtml.getVersion(first), 1);
    assert.equal(ParserHtml.parse(first, build), parsedFirst);

    const changed = fixture('<span>Second</span>', 2, first.file.uri);
    const parsedSecond = ParserHtml.parse(changed, build);
    assert.notEqual(parsedSecond, parsedFirst);
    assert.equal(ParserHtml.getVersion(changed), 2);
    assert.ok(parsedSecond.tags.some(tag => tag.tagName === 'span'));
    assert.ok(!parsedSecond.tags.some(tag => tag.tagName === 'div'));
});

test('HTML parser keeps independent cache entries for distinct URIs with equal versions', () => {
    const first = fixture('<button>One</button>');
    const second = fixture('<input />');
    const firstResult = ParserHtml.parse(first, build);
    const secondResult = ParserHtml.parse(second, build);
    assert.notEqual(firstResult, secondResult);
    assert.ok(firstResult.tags.some(tag => tag.tagName === 'button'));
    assert.ok(secondResult.tags.some(tag => tag.tagName === 'input'));
});
