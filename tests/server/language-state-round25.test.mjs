import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../server/src/language-services/i18n/Parser.ts';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }, { AventusI18nLanguageService }] = await loadServerModules([
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/i18n/LanguageService.ts',
]);

function scssFile(source, uri) {
    return { documentUser: TextDocument.create(uri, 'scss', 1, source) };
}

function translation(source, locales = ['en', 'fr']) {
    const uri = 'file:///D:/app/round25.i18n.avt';
    const documentUser = TextDocument.create(uri, 'json', 1, source);
    return {
        file: { uri, documentUser, contentUser: source },
        build: { buildConfig: { i18n: { locales } } },
        parsed: I18nParser.parse(documentUser),
        parsedSrc: JSON.parse(source),
    };
}

test('global SCSS collision falls back to the second source after the first is removed', () => {
    const service = new AventusGlobalSCSSLanguageService();
    const firstUri = 'file:///D:/app/first.scss.avt';
    const secondUri = 'file:///D:/app/second.scss.avt';
    service.loadVariables({ file: scssFile(':root { --accent: red; }', firstUri) }, firstUri);
    service.loadVariables({ file: scssFile(':root { --accent: blue; --spacing: 4px; }', secondUri) }, secondUri);
    assert.equal(service.getDefinition('--accent')?.uri, firstUri);
    assert.equal(service.getDefinition('--spacing')?.uri, secondUri);

    service.removeVariables(firstUri);
    assert.equal(service.getDefinition('--accent')?.uri, secondUri);
    assert.equal(service.getDefinition('--accent')?.value, 'blue');
    service.removeVariables(secondUri);
    assert.equal(service.getDefinition('--accent'), undefined);
    assert.equal(service.getDefinition('--spacing'), undefined);
});

test('reloading a global SCSS source releases a duplicate name to another source', async () => {
    const globalSCSSLanguageService = new AventusGlobalSCSSLanguageService();
    const firstUri = 'file:///D:/app/first-reloaded.scss.avt';
    const secondUri = 'file:///D:/app/second-reloaded.scss.avt';
    globalSCSSLanguageService.loadVariables({ file: scssFile(':root { --accent: red; }', firstUri) }, firstUri);
    globalSCSSLanguageService.loadVariables({ file: scssFile(':root { --accent: blue; }', secondUri) }, secondUri);
    const component = new AventusSCSSLanguageService({ globalSCSSLanguageService });
    const source = '.panel { color: var(--accent); }';
    const file = scssFile(source, 'file:///D:/app/component.scss.avt');
    const position = file.documentUser.positionAt(source.indexOf('--accent') + 3);
    assert.equal((await component.findDefinition(file, position))?.[0]?.uri, firstUri);

    globalSCSSLanguageService.loadVariables({ file: scssFile(':root { --other: green; }', firstUri) }, firstUri);
    assert.equal(globalSCSSLanguageService.getDefinition('--other')?.uri, firstUri);
    assert.equal((await component.findDefinition(file, position))?.[0]?.uri, secondUri);
    assert.match((await component.doHover(file, position))?.contents?.value ?? '', /--accent: blue/);
});

test('SCSS documentation rebuild is deferred while disabled and applies removals when enabled', async () => {
    const globalSCSSLanguageService = new AventusGlobalSCSSLanguageService();
    const service = new AventusSCSSLanguageService({ globalSCSSLanguageService });
    const file = scssFile('.panel { color: red; }', 'file:///D:/app/panel.scss.avt');
    const position = file.documentUser.positionAt(file.documentUser.getText().indexOf('color'));
    const labels = async () => (await service.doComplete(file, position)).items.map(item => item.label);

    service.addExternalDefinition('file:///D:/app/external.scss.avt', { '.panel': [{ name: 'external-token' }] });
    assert.ok((await labels()).includes('external-token'));
    service.allowRebuildDefinition(false);
    service.removeExternalDefinition('file:///D:/app/external.scss.avt');
    service.addInternalDefinition('file:///D:/app/internal.scss.avt', { '.panel': [{ name: 'internal-token' }] });
    assert.ok((await labels()).includes('external-token'));
    assert.ok(!(await labels()).includes('internal-token'));

    service.allowRebuildDefinition(true);
    assert.ok(!(await labels()).includes('external-token'));
    assert.ok((await labels()).includes('internal-token'));
});

test('i18n offers no locale import when every message has all configured locales', async () => {
    const file = translation('{"hello":{"en":"Hello","fr":"Bonjour"},"bye":{"en":"Bye","fr":"Salut"}}');
    const service = AventusI18nLanguageService.getInstance();
    assert.deepEqual(await service.validate(file), []);
    assert.deepEqual(await service.codeAction(file, null), []);
});

test('i18n locale import changes only incomplete messages', async () => {
    const file = translation('{"complete":{"en":"Hello","fr":"Bonjour"},"missing":{"en":"Hi"}}');
    const actions = await AventusI18nLanguageService.getInstance().codeAction(file, null);
    assert.equal(actions.length, 1);
    const updated = JSON.parse(actions[0].edit.changes[file.file.uri][0].newText);
    assert.deepEqual(updated.complete, { en: 'Hello', fr: 'Bonjour' });
    assert.deepEqual(updated.missing, { en: 'Hi', fr: 'ⵌⵌ' });
});
