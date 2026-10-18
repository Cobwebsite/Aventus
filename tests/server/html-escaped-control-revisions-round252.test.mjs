import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('escaped HTML controls remain literal while neighboring live controls change across edits', () => {
    const uri = `file:///D:/round252/escaped-controls-${process.pid}.html.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const first = parse('<div>\\{{literal}} \\if (fake) { <i>literal</i> } if (ready) { <b :title="active">text</b> }</div>');
    assert.deepEqual(first.errors, []);
    assert.equal(first.ifs.length, 1);
    assert.deepEqual(first.injections.map(item => item.injectTsTxt), ['active']);
    assert.match(first.compiledTxt, /&#123;&#123;literal&#125;&#125;/);
    assert.match(first.compiledTxt, /&#105;f \(fake\)/);

    const second = parse('<div>\\{{literal}} \\for (fake of list) { <i>literal</i> } for (const item of items) { <b :title="item">text</b> }</div>');
    assert.deepEqual(second.errors, []);
    assert.equal(second.ifs.length, 0);
    assert.equal(second.loops.length, 1);
    assert.deepEqual(second.injections.map(item => item.injectTsTxt), ['item']);
    assert.match(second.compiledTxt, /&#102;or \(fake/);
    assert.doesNotMatch(second.compiledTxt, /ready|active/);

    const third = parse('<div>\\{{literal}} \\if (fake) { <i>literal</i> }</div>');
    assert.deepEqual(third.errors, []);
    assert.equal(third.ifs.length, 0);
    assert.equal(third.loops.length, 0);
    assert.deepEqual(third.injections, []);
    assert.doesNotMatch(third.compiledTxt, /items|item|ready|active/);
});
