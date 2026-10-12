import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/scss/LanguageService.ts',
]);

function file(uri, text, version = 1) {
    return { documentUser: TextDocument.create(uri, 'scss', version, text) };
}

function at(document, name, occurrence = 0) {
    let offset = -1;
    for (let index = 0; index <= occurrence; index++) {
        offset = document.getText().indexOf(name, offset + 1);
    }
    assert.ok(offset >= 0);
    return document.positionAt(offset + 3);
}

test('global SCSS references from the declaration omit consumers in other files after edits', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    const component = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const themeUri = 'file:///D:/round131/theme.scss.avt';
    const cardUri = 'file:///D:/round131/card.wcs.avt';
    const badgeUri = 'file:///D:/round131/badge.wcs.avt';
    const theme = file(themeUri, ':root { --accent: red; } .preview { color: var(--accent); }');
    const card = file(cardUri, '.card { color: var(--accent); }');
    const badge = file(badgeUri, '.badge { border-color: var(--accent); }');

    global.loadVariables({ file: theme }, themeUri);
    assert.equal((await component.findDefinition(card, at(card.documentUser, '--accent')))?.[0]?.uri, themeUri);
    assert.equal((await component.findDefinition(badge, at(badge.documentUser, '--accent')))?.[0]?.uri, themeUri);
    const declarationReferences = await global.onReferences(theme, at(theme.documentUser, '--accent'));
    assert.deepEqual(declarationReferences.map(location => location.uri), [themeUri, themeUri]);
    assert.ok(declarationReferences.every(location => theme.documentUser.getText(location.range) === '--accent'));

    const revised = file(themeUri, ':root { --tone: blue; } .preview { color: var(--tone); }', 2);
    global.loadVariables({ file: revised }, themeUri);
    assert.equal(await component.findDefinition(card, at(card.documentUser, '--accent')), null);
    const revisedReferences = await global.onReferences(revised, at(revised.documentUser, '--tone'));
    assert.deepEqual(revisedReferences.map(location => location.uri), [themeUri, themeUri]);
    assert.ok(revisedReferences.every(location => revised.documentUser.getText(location.range) === '--tone'));
});
