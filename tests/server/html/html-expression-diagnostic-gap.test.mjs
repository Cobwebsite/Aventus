import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('malformed injection and binding expressions produce syntax diagnostics that recover after edits', () => {
    const uri = `file:///D:/test/html-expression-diagnostic-gap-round208-${process.pid}.wcv.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: { componentClassName: 'Card', viewMethodName: 'view' }, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };
    const check = (source, parsed, expectedInjection, expectedBinding) => {
        assert.deepEqual(parsed.injections.map(item => item.injectTsTxt), [expectedInjection]);
        assert.deepEqual(parsed.bindings.map(item => item.injectTsTxt), [expectedBinding]);
        assert.equal(source.slice(parsed.injections[0].start, parsed.injections[0].end), `"${expectedInjection}"`);
        assert.equal(source.slice(parsed.bindings[0].start, parsed.bindings[0].end), `"${expectedBinding}"`);
    };

    const firstSource = '<input :title="model[" @bind:value="state[">';
    const first = parse(firstSource);
    check(firstSource, first, 'model[', 'state[');
    assert.equal(first.errors.length, 2);
    assert.deepEqual(first.errors.map(error => firstSource.slice(file.documentUser.offsetAt(error.range.start), file.documentUser.offsetAt(error.range.end))), ['model[', 'state[']);

    const repairedSource = '\n<section>\n  <input :title="model[0]" @bind:value="state[0]">\n</section>';
    const repaired = parse(repairedSource);
    check(repairedSource, repaired, 'model[0]', 'state[0]');
    assert.deepEqual(repaired.errors, []);

    const relapseSource = '\n\n<input :title="other(" @bind:value="form(">';
    const relapse = parse(relapseSource);
    check(relapseSource, relapse, 'other(', 'form(');
    assert.equal(relapse.errors.length, 2);
    assert.deepEqual(relapse.errors.map(error => relapseSource.slice(file.documentUser.offsetAt(error.range.start), file.documentUser.offsetAt(error.range.end))), ['other(', 'form(']);
});
