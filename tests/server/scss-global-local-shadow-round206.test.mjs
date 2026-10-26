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

test('a local custom property shadows a global one for references, definition and hover', async () => {
    const project = { scssFiles: {}, getBuilds: () => [build] };
    const global = new AventusGlobalSCSSLanguageService(project);
    const build = { project, scssFiles: {}, globalSCSSLanguageService: global };
    const local = new AventusSCSSLanguageService(build);
    const source = file(sourceUri, 1, ':root { --accent: red; }');
    global.loadVariables({ file: source }, sourceUri);
    let card = file(localUri, 1, '.card { --accent: blue; color: var(--accent); }');
    const badge = file(otherUri, 1, '.badge { color: var(--accent); }');

    const cardUsage = position(card, '--accent', 1);
    const cardReferences = await local.onReferences(card, cardUsage);
    assert.deepEqual(cardReferences.map(({ uri }) => uri), [localUri, localUri]);
    assert.ok(cardReferences.every(({ range }) => card.documentUser.getText(range) === '--accent'));
    const localRename = local.onRename(card, cardUsage, 'local-tone');
    assert.deepEqual(Object.keys(localRename.changes), [localUri]);
    assert.equal(localRename.changes[localUri].length, 2);
    assert.ok(localRename.changes[localUri].every(edit => edit.newText === '--local-tone'));
    const cardDefinition = (await local.findDefinition(card, cardUsage))?.[0];
    assert.equal(cardDefinition?.uri, localUri);
    assert.equal(card.documentUser.getText(cardDefinition.range), '--accent');
    assert.doesNotMatch(JSON.stringify(await local.doHover(card, cardUsage)), /red/);
    assert.equal((await local.findDefinition(badge, position(badge, '--accent')))?.[0]?.uri, sourceUri);
    assert.match(JSON.stringify(await local.doHover(badge, position(badge, '--accent'))), /red/);

    card = file(localUri, 2, '.card { --accent: blue; color: var(--accent); border: var(--accent); }');
    const revisedReferences = await local.onReferences(card, position(card, '--accent', 2));
    assert.deepEqual(revisedReferences.map(({ uri }) => uri), [localUri, localUri, localUri]);
    assert.equal((await local.findDefinition(card, position(card, '--accent', 2)))?.[0]?.uri, localUri);
    assert.doesNotMatch(JSON.stringify(await local.doHover(card, position(card, '--accent', 2))), /red/);

    global.removeVariables(sourceUri);
    const localDefinition = (await local.findDefinition(card, position(card, '--accent', 2)))?.[0];
    assert.equal(localDefinition?.uri, localUri);
    assert.equal(card.documentUser.getText(localDefinition.range), '--accent');
    assert.equal(await local.findDefinition(badge, position(badge, '--accent')), null);
});
