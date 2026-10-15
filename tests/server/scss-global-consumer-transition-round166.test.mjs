import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts', 'language-services/scss/LanguageService.ts',
]);

test('deux composants suivent le remplacement de leur variable globale à des moments différents', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const globalUri = 'file:///D:/round166/theme.scss.avt';
    const cardUri = 'file:///D:/round166/card.wcs.avt';
    const badgeUri = 'file:///D:/round166/badge.wcs.avt';
    const file = (uri, version, text) => ({ documentUser: TextDocument.create(uri, 'scss', version, text) });
    const at = (entry, name) => entry.documentUser.positionAt(entry.documentUser.getText().indexOf(name) + 3);
    const source = file(globalUri, 1, ':root { --accent: red; }');
    global.loadVariables({ file: source }, globalUri);
    let card = file(cardUri, 1, '.card { color: var(--accent); }');
    let badge = file(badgeUri, 1, '.badge { border-color: var(--accent); }');
    assert.equal((await local.findDefinition(card, at(card, '--accent')))?.[0]?.uri, globalUri);
    assert.equal((await local.findDefinition(badge, at(badge, '--accent')))?.[0]?.uri, globalUri);

    const renamed = file(globalUri, 2, ':root { --tone: blue; }');
    global.loadVariables({ file: renamed }, globalUri);
    assert.equal(await local.findDefinition(card, at(card, '--accent')), null);
    assert.equal(await local.findDefinition(badge, at(badge, '--accent')), null);
    card = file(cardUri, 2, '.card { color: var(--tone); }');
    const cardDefinition = await local.findDefinition(card, at(card, '--tone'));
    assert.equal(cardDefinition?.[0]?.uri, globalUri);
    assert.equal(cardDefinition[0].range.start.line, 0);
    assert.equal(renamed.documentUser.getText(cardDefinition[0].range), '--tone');
    assert.equal(await local.findDefinition(badge, at(badge, '--accent')), null);

    badge = file(badgeUri, 2, '.badge { border-color: var(--tone); }');
    assert.equal((await local.findDefinition(badge, at(badge, '--tone')))?.[0]?.uri, globalUri);
    global.removeVariables(globalUri);
    assert.equal(await local.findDefinition(card, at(card, '--tone')), null);
    assert.equal(await local.findDefinition(badge, at(badge, '--tone')), null);
});

test('une déclaration globale précédée d’un saut de ligne devient introuvable jusqu’au retrait du préfixe', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const uri = 'file:///D:/round166/leading-newline.scss.avt';
    const consumer = { documentUser: TextDocument.create('file:///D:/round166/consumer.wcs.avt', 'scss', 1, '.card { color: var(--tone); }') };
    const position = consumer.documentUser.positionAt(consumer.documentUser.getText().indexOf('--tone') + 3);
    const load = (version, text) => global.loadVariables({ file: { documentUser: TextDocument.create(uri, 'scss', version, text) } }, uri);

    load(1, ':root { --tone: red; }');
    assert.equal((await local.findDefinition(consumer, position))?.[0]?.uri, uri);
    load(2, '\n:root { --tone: blue; }');
    assert.equal(global.getDefinition('--tone'), undefined);
    assert.equal(await local.findDefinition(consumer, position), null);
    load(3, ':root { --tone: green; }');
    assert.equal((await local.findDefinition(consumer, position))?.[0]?.uri, uri);
});
