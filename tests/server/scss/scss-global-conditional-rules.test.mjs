import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/scss/LanguageService.ts',
]);

function document(uri, version, text) {
    return { documentUser: TextDocument.create(uri, 'scss', version, text) };
}

test('a root variable inside a supports rule follows edits and stays navigable from a component', async () => {
    const globals = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: globals });
    const uri = 'file:///D:/round239/supports.scss.avt';
    const consumer = document('file:///D:/round239/card.wcs.avt', 1, '.card { color: var(--accent); }');
    const position = consumer.documentUser.positionAt(consumer.documentUser.getText().indexOf('--accent') + 3);
    const load = (version, text) => {
        const source = document(uri, version, text);
        globals.loadVariables({ file: source }, uri);
        return source.documentUser;
    };
    const definition = async (source, value) => {
        const result = (await local.findDefinition(consumer, position))?.[0];
        assert.equal(result?.uri, uri);
        assert.equal(source.getText(result.range), '--accent');
        assert.equal((await local.doHover(consumer, position))?.contents?.value, `--accent: ${value}`);
    };

    const first = load(1, '@supports (color: var(--accent)) { :root { --accent: red; } }');
    await definition(first, 'red');

    load(2, '@supports (display: grid) { .card { --accent: blue; } }');
    assert.equal(globals.getDefinition('--accent'), undefined);
    assert.equal(await local.findDefinition(consumer, position), null);

    const restored = load(3, '@supports (display: grid) { :root { --accent: green; } }');
    await definition(restored, 'green');
});

test('a variable in a nested media and supports rule is replaced without retaining its old declaration', () => {
    const globals = new AventusGlobalSCSSLanguageService();
    const uri = 'file:///D:/round239/nested.scss.avt';
    const load = (version, text) => {
        const source = document(uri, version, text);
        globals.loadVariables({ file: source }, uri);
        return source.documentUser;
    };

    const first = load(1, '@media screen { @supports (display: grid) { :root { --theme: navy; } } }');
    assert.equal(globals.getDefinition('--theme')?.value, 'navy');
    assert.equal(first.getText(globals.getDefinition('--theme').range), '--theme');

    const second = load(2, '@media screen { @supports (display: grid) { :root { --layout: wide; } } }');
    assert.equal(globals.getDefinition('--theme'), undefined);
    assert.equal(globals.getDefinition('--layout')?.value, 'wide');
    assert.equal(second.getText(globals.getDefinition('--layout').range), '--layout');

    globals.removeVariables(uri);
    assert.equal(globals.getDefinition('--layout'), undefined);
});
