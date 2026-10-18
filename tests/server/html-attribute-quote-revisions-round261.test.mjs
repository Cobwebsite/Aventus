import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('attribute expressions retain their source ranges when quote style and neighboring tags change', () => {
    const uri = `file:///D:/round261/attribute-quotes-${process.pid}.html.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const firstText = `<button :title='item.name' @click='open(item)'>Open</button><p :title="tail">Tail</p>`;
    const first = parse(firstText);
    assert.deepEqual(first.errors, []);
    assert.deepEqual(first.injections.map(item => item.injectTsTxt), ["'item.name'", 'tail']);
    assert.deepEqual(first.injections.map(item => firstText.slice(item.start, item.end)), ["'item.name'", '"tail"']);

    const secondText = `<i>Before</i>\r\n<button :title="item.label" @click="select(item)">Select</button>`;
    const second = parse(secondText);
    assert.deepEqual(second.errors, []);
    assert.deepEqual(second.injections.map(item => item.injectTsTxt), ['item.label']);
    assert.deepEqual(second.injections.map(item => secondText.slice(item.start, item.end)), ['"item.label"']);
    assert.doesNotMatch(second.compiledTxt, /item\.name|tail/);

    const third = parse('<button title="Plain">Done</button>');
    assert.deepEqual(third.errors, []);
    assert.deepEqual(third.injections, []);
});
