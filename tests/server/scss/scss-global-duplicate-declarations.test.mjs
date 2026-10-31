import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/scss/LanguageService.ts',
]);

test('duplicate declarations in one global SCSS file select the last surviving value after edits', async () => {
    const globals = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: globals });
    const globalUri = 'file:///D:/round229/theme.scss.avt';
    const consumerUri = 'file:///D:/round229/card.wcs.avt';
    const consumer = { documentUser: TextDocument.create(consumerUri, 'scss', 1, '.card { color: var(--tone); }') };
    const position = consumer.documentUser.positionAt(consumer.documentUser.getText().indexOf('--tone') + 3);
    const load = (text, version) => {
        const documentUser = TextDocument.create(globalUri, 'scss', version, text);
        globals.loadVariables({ file: { documentUser } }, globalUri);
        return documentUser;
    };
    const verify = async (document, expectedValue, expectedOffset) => {
        const definition = (await local.findDefinition(consumer, position))?.[0];
        assert.equal(definition?.uri, globalUri);
        assert.deepEqual(definition?.range.start, document.positionAt(expectedOffset));
        assert.equal((await local.doHover(consumer, position))?.contents?.value, `--tone: ${expectedValue}`);
    };

    const firstText = ':root { --tone: red; --tone: blue; }';
    await verify(load(firstText, 1), 'blue', firstText.lastIndexOf('--tone'));

    const secondText = ':root { --tone: blue; }';
    await verify(load(secondText, 2), 'blue', secondText.indexOf('--tone'));

    const thirdText = ':root { --tone: green; --tone: yellow; }';
    await verify(load(thirdText, 3), 'yellow', thirdText.lastIndexOf('--tone'));

    load(':root { --other: orange; }', 4);
    assert.equal(await local.findDefinition(consumer, position), null);
});
