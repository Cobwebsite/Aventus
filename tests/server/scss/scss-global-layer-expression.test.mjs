import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/scss/LanguageService.ts',
]);

test('global variable in a CSS layer keeps a complex value and updates consumer navigation', async () => {
    const globals = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: globals });
    const uri = 'file:///D:/round243/layer.scss.avt';
    const consumer = { documentUser: TextDocument.create('file:///D:/round243/card.wcs.avt', 'scss', 1,
        '.card { background: var(--surface); }') };
    const position = consumer.documentUser.positionAt(consumer.documentUser.getText().indexOf('--surface') + 3);
    const load = (version, text) => {
        const source = TextDocument.create(uri, 'scss', version, text);
        globals.loadVariables({ file: { documentUser: source } }, uri);
        return source;
    };

    const first = load(1, '@layer tokens { :root { --surface: color-mix(in srgb, red 30%, blue); } }');
    assert.equal(globals.getDefinition('--surface')?.value, 'color-mix(in srgb, red 30%, blue)');
    assert.equal(first.getText(globals.getDefinition('--surface').range), '--surface');
    assert.equal((await local.findDefinition(consumer, position))?.[0]?.uri, uri);
    assert.equal((await local.doHover(consumer, position))?.contents?.value,
        '--surface: color-mix(in srgb, red 30%, blue)');

    const second = load(2, '@layer tokens { :root { --surface: var(--base, green); } }');
    assert.equal(globals.getDefinition('--surface')?.value, 'var(--base, green)');
    assert.equal(second.getText((await local.findDefinition(consumer, position))[0].range), '--surface');
    assert.equal((await local.doHover(consumer, position))?.contents?.value, '--surface: var(--base, green)');

    load(3, '@layer tokens { .card { --surface: black; } }');
    assert.equal(globals.getDefinition('--surface'), undefined);
    assert.equal(await local.findDefinition(consumer, position), null);
});
