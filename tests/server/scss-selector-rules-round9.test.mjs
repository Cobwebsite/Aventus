import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

function selectors(source) {
    const service = new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });
    const documentUser = TextDocument.create('file:///D:/test/selectors-round9.scss.avt', 'scss', 1, source);
    return [...service.getRules({ documentUser }).keys()];
}
function tag(tagName, className = '', parent = null) {
    return { tagName, attributes: className ? { class: { value: className } } : {}, parent };
}

test('SCSS selector matching distinguishes class tokens from substrings', () => {
    const matches = selectors('.card { color: red; }');
    assert.equal(matches.length, 1);
    assert.equal(matches[0](tag('div', 'card active')), true);
    assert.equal(matches[0](tag('div', 'cardinal')), false);
    assert.equal(matches[0](tag('div', 'active')), false);
});

test('SCSS selector matching requires both element and class for a compound selector', () => {
    const matches = selectors('button.primary { color: red; }');
    assert.equal(matches.length, 1);
    assert.equal(matches[0](tag('button', 'primary')), true);
    assert.equal(matches[0](tag('button', 'secondary')), false);
    assert.equal(matches[0](tag('div', 'primary')), false);
});

test('nested SCSS selectors require a matching ancestor', () => {
    const matches = selectors('.panel { color: blue; .item { color: red; } }');
    assert.equal(matches.length, 2);
    const childRule = matches.find(matchesTag => matchesTag(tag('span', 'item', tag('section', 'panel'))));
    assert.ok(childRule);
    assert.equal(childRule(tag('span', 'item')), false);
    assert.equal(childRule(tag('span', 'item', tag('section', 'other'))), false);
});
