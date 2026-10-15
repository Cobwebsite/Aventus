import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/scss/LanguageService.ts',
]);

test('une variable globale suit les revisions de commentaire initial sur la meme instance', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const uri = 'file:///D:/round174/theme.scss.avt';
    const consumer = { documentUser: TextDocument.create('file:///D:/round174/card.wcs.avt', 'scss', 1,
        '.card { color: var(--accent); }') };
    const position = consumer.documentUser.positionAt(consumer.documentUser.getText().indexOf('--accent') + 3);
    const load = (version, content) => {
        const documentUser = TextDocument.create(uri, 'scss', version, content);
        global.loadVariables({ file: { documentUser } }, uri);
        return documentUser;
    };

    const first = load(1, ':root { --accent: red; }');
    assert.equal(first.getText(global.getDefinition('--accent').range), '--accent');
    assert.equal((await local.findDefinition(consumer, position))?.[0]?.uri, uri);

    load(2, '/* theme */:root { --accent: blue; }');
    assert.equal(global.getDefinition('--accent'), undefined);
    assert.equal(await local.findDefinition(consumer, position), null);

    load(3, '// theme\n:root { --accent: green; }');
    assert.equal(global.getDefinition('--accent'), undefined);
    assert.equal(await local.findDefinition(consumer, position), null);

    const repaired = load(4, ':root { --accent: purple; }');
    const definition = (await local.findDefinition(consumer, position))?.[0];
    assert.equal(definition?.uri, uri);
    assert.equal(repaired.getText(definition.range), '--accent');
    assert.match((await local.doHover(consumer, position))?.contents?.value ?? '', /--accent: purple/);
});
