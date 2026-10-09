import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../server/src/language-services/i18n/Parser.ts';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusI18nLanguageService }, { AventusGlobalSCSSLanguageService }] = await loadServerModules([
    'language-services/i18n/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
]);

const i18n = AventusI18nLanguageService.getInstance();

function translation(content, locales = ['en', 'fr']) {
    const uri = 'file:///round21.i18n.avt';
    const documentUser = TextDocument.create(uri, 'json', 1, content);
    return {
        file: { uri, documentUser, contentUser: content },
        build: { buildConfig: { i18n: { locales } } },
        parsed: I18nParser.parse(documentUser),
        parsedSrc: JSON.parse(content),
    };
}

test('i18n validation keeps comment-like text inside translation values', async () => {
    const source = '{"website":{"en":"https://example.test/a//b","fr":"/* texte */"}}';
    const diagnostics = await i18n.validate(translation(source));
    assert.deepEqual(diagnostics, []);
});

test('i18n validation reports missing locale only for the affected message', async () => {
    const source = '{"complete":{"en":"Hello","fr":"Bonjour"},"incomplete":{"en":"Hi"}}';
    const fixture = translation(source);
    const diagnostics = await i18n.validate(fixture);
    assert.equal(diagnostics.length, 1);
    assert.match(diagnostics[0].message, /Missing locales fr/);
    assert.equal(fixture.file.documentUser.getText(diagnostics[0].range), '"incomplete"');
});

test('global SCSS validation keeps empty rules visible while local rules filter them', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    const file = { documentUser: TextDocument.create('file:///global-round21.scss.avt', 'scss', 1, '.empty {}') };
    const diagnostics = await global.doValidation(file);
    assert.ok(diagnostics.some(item => item.code === 'emptyRules'));
});
