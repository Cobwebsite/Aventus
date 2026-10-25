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

    const blockComment = load(2, '/* theme */:root { --accent: blue; }');
    const blockDefinition = (await local.findDefinition(consumer, position))?.[0];
    assert.equal(blockDefinition?.uri, uri);
    assert.equal(blockComment.getText(blockDefinition.range), '--accent');

    const lineComment = load(3, '// theme\n:root { --accent: green; }');
    const lineDefinition = (await local.findDefinition(consumer, position))?.[0];
    assert.equal(lineDefinition?.uri, uri);
    assert.equal(lineComment.getText(lineDefinition.range), '--accent');
    assert.equal(lineDefinition.range.start.line, 1);

    const repaired = load(4, ':root { --accent: purple; }');
    const definition = (await local.findDefinition(consumer, position))?.[0];
    assert.equal(definition?.uri, uri);
    assert.equal(repaired.getText(definition.range), '--accent');
    assert.match((await local.doHover(consumer, position))?.contents?.value ?? '', /--accent: purple/);

    const grouped = load(5, '.theme, :root { --accent: orange; }');
    const groupedDefinition = (await local.findDefinition(consumer, position))?.[0];
    assert.equal(groupedDefinition?.uri, uri);
    assert.equal(grouped.getText(groupedDefinition.range), '--accent');
    assert.match((await local.doHover(consumer, position))?.contents?.value ?? '', /--accent: orange/);
});
