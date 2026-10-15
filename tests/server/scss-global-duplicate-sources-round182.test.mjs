import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/scss/LanguageService.ts',
]);

test('duplicate global variables switch to the surviving source after edits and deletion', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const primaryUri = 'file:///D:/round182/primary.scss.avt';
    const fallbackUri = 'file:///D:/round182/fallback.scss.avt';
    const consumerUri = 'file:///D:/round182/card.wcs.avt';
    const consumer = { documentUser: TextDocument.create(consumerUri, 'scss', 1, '.card { color: var(--accent); }') };
    const position = consumer.documentUser.positionAt(consumer.documentUser.getText().indexOf('--accent') + 3);
    const load = (uri, version, content) => {
        const documentUser = TextDocument.create(uri, 'scss', version, content);
        global.loadVariables({ file: { documentUser } }, uri);
        return documentUser;
    };
    const check = async (uri, value, document) => {
        const indexed = global.getDefinition('--accent');
        assert.equal(indexed?.uri, uri);
        assert.equal(indexed?.value, value);
        assert.equal(document.getText(indexed.range), '--accent');
        const definition = (await local.findDefinition(consumer, position))?.[0];
        assert.deepEqual(definition, { uri, range: indexed.range });
        assert.equal((await local.doHover(consumer, position))?.contents?.value, `--accent: ${value}`);
    };

    const primary = load(primaryUri, 1, ':root { --accent: red; }');
    load(fallbackUri, 1, ':root { --accent: blue; }');
    await check(primaryUri, 'red', primary);

    // Reopening the later source does not move it ahead of the earlier source.
    load(fallbackUri, 2, ':root { --accent: cyan; }');
    await check(primaryUri, 'red', primary);

    // Removing the first source's declaration exposes the updated fallback.
    load(primaryUri, 2, ':root { --other: green; }');
    const updatedFallback = TextDocument.create(fallbackUri, 'scss', 2, ':root { --accent: cyan; }');
    await check(fallbackUri, 'cyan', updatedFallback);

    // Reinsertion restores the original source's priority, independent of edit order.
    const restoredPrimary = load(primaryUri, 3, ':root { --accent: orange; }');
    await check(primaryUri, 'orange', restoredPrimary);
    global.removeVariables(primaryUri);
    await check(fallbackUri, 'cyan', updatedFallback);
    global.removeVariables(fallbackUri);
    assert.equal(global.getDefinition('--accent'), undefined);
    assert.equal(await local.findDefinition(consumer, position), null);
    assert.doesNotMatch((await local.doHover(consumer, position))?.contents?.value ?? '', /--accent:/);
});
