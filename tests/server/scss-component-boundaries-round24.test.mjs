import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
]);

function service() {
    return new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });
}

function file(source) {
    return { documentUser: TextDocument.create('file:///D:/round24-component.scss.avt', 'scss', 1, source) };
}

test('component SCSS exports only host custom properties backed by their public variable', () => {
    const properties = AventusSCSSLanguageService.getCustomProperty(':host { /* Visible accent\n * @type color\n * @default blue */ --internal-accent: var(--accent, blue); --_spacing: var(--spacing, 4px); --internal-hidden: red; } .child { --internal-child: var(--child, green); }');
    assert.deepEqual(properties.map(property => property.name).sort(), ['--accent', '--spacing']);
    const accent = properties.find(property => property.name === '--accent');
    assert.equal(accent.type, 'color');
    assert.equal(accent.defaultValue, 'blue');
    assert.match(accent.documentation, /Visible accent/);
    assert.equal(properties.find(property => property.name === '--spacing').defaultValue, '4px');
});

test('nested SCSS selector requires a matching ancestor and returns the child source range', () => {
    const source = '.panel { .entry { color: red; } }';
    const rules = service().getRules(file(source));
    const entry = { tagName: 'span', attributes: { class: { value: 'entry' } }, parent: null };
    const panel = { tagName: 'div', attributes: { class: { value: 'panel' } }, parent: null };
    const nestedRule = [...rules].find(([, range]) => source.slice(range.start, range.end) === '.entry');
    assert.ok(nestedRule);
    assert.equal(nestedRule[0](entry), false);
    entry.parent = panel;
    assert.equal(nestedRule[0](entry), true);
    entry.parent = { tagName: 'section', attributes: {}, parent: panel };
    assert.equal(nestedRule[0](entry), true);
});

test('host custom property extraction currently skips a stylesheet with leading whitespace', () => {
    const source = ':host { --internal-accent: var(--accent, red); }';
    assert.deepEqual(AventusSCSSLanguageService.getCustomProperty(source).map(item => item.name), ['--accent']);
    assert.deepEqual(AventusSCSSLanguageService.getCustomProperty(`\n  ${source}`).map(item => item.name), []);
});
