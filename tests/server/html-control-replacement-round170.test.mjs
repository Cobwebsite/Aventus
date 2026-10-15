import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('le remplacement d’une boucle conditionnelle par une autre vue renouvelle contrôles, injections et plages', () => {
    const uri = `file:///D:/test/html-control-replacement-round170-${process.pid}.html.avt`;
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const original = parse('for (const oldItem of oldItems) { if (oldItem.visible) { <p :title="oldItem.label">Old</p> } }');
    assert.deepEqual(original.errors, []);
    assert.equal(original.loops.length, 1);
    assert.equal(original.ifs.length, 1);
    assert.deepEqual(original.injections.map(value => value.injectTsTxt), ['oldItem.label']);

    const replacementSource = '\nif (ready) { <section :title="heading">Message</section> } else { <aside :title="fallback">Fallback</aside> }';
    const replacement = parse(replacementSource);
    assert.deepEqual(replacement.errors, []);
    assert.deepEqual(replacement.loops, []);
    assert.equal(replacement.ifs.length, 1);
    assert.deepEqual(replacement.ifs[0].conditions.map(value => value.type), ['if']);
    assert.deepEqual(replacement.injections.map(value => value.injectTsTxt), ['heading', 'fallback']);
    for (const injection of replacement.injections) {
        assert.match(replacementSource.slice(injection.start, injection.end), /heading|fallback/);
    }
    assert.doesNotMatch(replacement.compiledTxt, /oldItem|oldItems|visible|label/);

    const final = parse('<div>Plain</div>');
    assert.deepEqual(final.errors, []);
    assert.deepEqual(final.loops, []);
    assert.deepEqual(final.ifs, []);
    assert.deepEqual(final.injections, []);
    assert.doesNotMatch(final.compiledTxt, /heading|fallback|oldItem/);
});
