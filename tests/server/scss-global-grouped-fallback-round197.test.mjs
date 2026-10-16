import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/scss/LanguageService.ts',
]);

test('grouped root declarations are available to cross-file consumers and fall back after removal', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const primaryUri = 'file:///D:/round197/primary.scss.avt';
    const fallbackUri = 'file:///D:/round197/fallback.scss.avt';
    const consumerUri = 'file:///D:/round197/card.wcs.avt';
    const consumer = { documentUser: TextDocument.create(consumerUri, 'scss', 1, '.card { color: var(--accent); }') };
    const position = consumer.documentUser.positionAt(consumer.documentUser.getText().indexOf('--accent') + 3);
    const load = (uri, version, content) => {
        const documentUser = TextDocument.create(uri, 'scss', version, content);
        global.loadVariables({ file: { documentUser } }, uri);
        return documentUser;
    };
    const check = async (uri, value, document) => {
        const definition = global.getDefinition('--accent');
        assert.equal(definition?.uri, uri);
        assert.equal(definition?.value, value);
        assert.equal(document.getText(definition.range), '--accent');
        assert.deepEqual((await local.findDefinition(consumer, position))?.[0], {
            uri,
            range: definition.range,
        });
    };

    const grouped = load(primaryUri, 1, ':root, html { --accent: red; }');
    const fallback = load(fallbackUri, 1, ':root { --accent: blue; }');
    await check(primaryUri, 'red', grouped);

    const ungrouped = load(primaryUri, 2, ':root { --accent: red; }');
    await check(primaryUri, 'red', ungrouped);

    load(primaryUri, 3, 'html { --accent: green; }');
    await check(fallbackUri, 'blue', fallback);

    global.removeVariables(fallbackUri);
    assert.equal(global.getDefinition('--accent'), undefined);
    assert.equal(await local.findDefinition(consumer, position), null);
});
