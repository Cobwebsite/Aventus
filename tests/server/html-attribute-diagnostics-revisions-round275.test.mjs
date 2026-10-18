import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('duplicate and deprecated attribute diagnostics move and clear across view revisions', () => {
    const uri = `file:///D:/round275/attribute-diagnostics-${process.pid}.html.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };
    const diagnostics = result => result.errors.map(error => ({
        message: error.message,
        text: file.documentUser.getText(error.range),
        line: error.range.start.line,
    }));

    const first = parse('<div id="first" id="second" @for="item"></div>');
    assert.deepEqual(diagnostics(first), [
        { message: 'Duplicate attribute id', text: 'id', line: 0 },
        { message: 'Deprecated : use for directly inside template', text: '@for', line: 0 },
    ]);
    assert.equal(first.tags[0].attributes.id.value, 'first');
    assert.equal(first.tags[0].attributes['@for'], undefined);

    const second = parse('<p>Before</p>\r\n<div id="new" id="again"></div>');
    assert.deepEqual(diagnostics(second), [
        { message: 'Duplicate attribute id', text: 'id', line: 1 },
    ]);
    assert.equal(second.tags[1].attributes.id.value, 'new');

    const third = parse('<p>Before</p>\r\n<div id="final"></div>');
    assert.deepEqual(diagnostics(third), []);
    assert.equal(third.tags[1].attributes.id.value, 'final');
});
