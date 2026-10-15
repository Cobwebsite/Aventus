import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/scss/LanguageService.ts',
]);

const sourceUri = 'file:///D:/round206/theme.scss.avt';
const localUri = 'file:///D:/round206/card.wcs.avt';
const otherUri = 'file:///D:/round206/badge.wcs.avt';
const file = (uri, version, text) => ({ documentUser: TextDocument.create(uri, 'scss', version, text) });
const position = (entry, name, occurrence = 0) => {
    let offset = -1;
    for (let index = 0; index <= occurrence; index++) {
        offset = entry.documentUser.getText().indexOf(name, offset + 1);
    }
    assert.ok(offset >= 0);
    return entry.documentUser.positionAt(offset + 3);
};

test('a local custom property shadows a global one for references but not definition navigation', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const source = file(sourceUri, 1, ':root { --accent: red; }');
    global.loadVariables({ file: source }, sourceUri);
    let card = file(localUri, 1, '.card { --accent: blue; color: var(--accent); }');
    const badge = file(otherUri, 1, '.badge { color: var(--accent); }');

    const cardUsage = position(card, '--accent', 1);
    const cardReferences = await local.onReferences(card, cardUsage);
    assert.deepEqual(cardReferences.map(({ uri }) => uri), [localUri, localUri]);
    assert.ok(cardReferences.every(({ range }) => card.documentUser.getText(range) === '--accent'));
    assert.equal((await local.findDefinition(card, cardUsage))?.[0]?.uri, sourceUri);
    assert.equal((await local.findDefinition(badge, position(badge, '--accent')))?.[0]?.uri, sourceUri);

    card = file(localUri, 2, '.card { --accent: blue; color: var(--accent); border: var(--accent); }');
    const revisedReferences = await local.onReferences(card, position(card, '--accent', 2));
    assert.deepEqual(revisedReferences.map(({ uri }) => uri), [localUri, localUri, localUri]);
    assert.equal((await local.findDefinition(card, position(card, '--accent', 2)))?.[0]?.uri, sourceUri);

    global.removeVariables(sourceUri);
    const localDefinition = (await local.findDefinition(card, position(card, '--accent', 2)))?.[0];
    assert.equal(localDefinition?.uri, localUri);
    assert.equal(card.documentUser.getText(localDefinition.range), '--accent');
    assert.equal(await local.findDefinition(badge, position(badge, '--accent')), null);
});
