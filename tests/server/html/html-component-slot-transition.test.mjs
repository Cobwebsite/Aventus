import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ParserHtml } = await loadServerModule('language-services/html/parser/ParserHtml.ts');

test('les slots et injections d’un composant suivent le remplacement puis le retrait d’une branche', () => {
    const uri = 'file:///D:/round161/component-slots.html.avt';
    const file = { uri, versionUser: 0, documentUser: null };
    const view = { file, tsFile: null, scssFile: null };
    const build = { getAvoidParsingTags: () => [], htmlLanguageService: { getClassByTag: () => null } };
    const parse = source => {
        file.versionUser++;
        file.documentUser = TextDocument.create(uri, 'aventus-html', file.versionUser, source);
        return ParserHtml.parse(view, build);
    };

    const first = parse('if (ready) { <demo-card><slot name="header">{{title}}</slot></demo-card> } else { <demo-card><slot name="body">Fallback</slot></demo-card> }');
    assert.deepEqual(first.errors, []);
    assert.deepEqual(first.tags.filter(tag => tag.tagName === 'slot').map(tag => tag.attributes.name.value), ['header', 'body']);
    assert.deepEqual(first.ifs[0].conditions.map(item => item.type), ['if']);

    const second = parse('\nif (enabled) { <demo-card><slot name="actions">{{label}}</slot></demo-card> }');
    assert.deepEqual(second.errors, []);
    assert.deepEqual(second.tags.filter(tag => tag.tagName === 'slot').map(tag => tag.attributes.name.value), ['actions']);
    assert.deepEqual(second.ifs[0].conditions.map(item => item.txt), ['enabled']);
    assert.doesNotMatch(second.compiledTxt, /Fallback|header|body|title/);
    assert.match(second.compiledTxt, /actions/);

    const final = parse('<demo-card><slot name="footer">Done</slot></demo-card>');
    assert.deepEqual(final.errors, []);
    assert.deepEqual(final.ifs, []);
    assert.deepEqual(final.tags.filter(tag => tag.tagName === 'slot').map(tag => tag.attributes.name.value), ['footer']);
    assert.doesNotMatch(final.compiledTxt, /actions|enabled|Fallback/);
});
