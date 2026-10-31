import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/scss/LanguageService.ts',
]);

test('a root variable inside a container rule is replaced and removed from a component lookup', async () => {
    const globals = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: globals });
    const uri = 'file:///D:/round249/container.scss.avt';
    const consumer = { documentUser: TextDocument.create('file:///D:/round249/panel.wcs.avt', 'scss', 1,
        '.panel { color: var(--container-ink); }') };
    const position = consumer.documentUser.positionAt(consumer.documentUser.getText().indexOf('--container-ink') + 3);
    const load = (version, text) => {
        const source = TextDocument.create(uri, 'scss', version, text);
        globals.loadVariables({ file: { documentUser: source } }, uri);
        return source;
    };

    const first = load(1, '@container card (min-width: 20rem) { :root { --container-ink: navy; } }');
    assert.equal(globals.getDefinition('--container-ink')?.value, 'navy');
    assert.equal(first.getText((await local.findDefinition(consumer, position))[0].range), '--container-ink');
    assert.equal((await local.doHover(consumer, position))?.contents?.value, '--container-ink: navy');

    const second = load(2, '@container card (min-width: 20rem) { :root { --container-ink: teal; } }');
    assert.equal(second.getText((await local.findDefinition(consumer, position))[0].range), '--container-ink');
    assert.equal((await local.doHover(consumer, position))?.contents?.value, '--container-ink: teal');

    load(3, '@container card (min-width: 20rem) { .panel { --container-ink: maroon; } }');
    assert.equal(globals.getDefinition('--container-ink'), undefined);
    assert.equal(await local.findDefinition(consumer, position), null);
});
