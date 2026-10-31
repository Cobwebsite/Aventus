import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';
import { parseI18nAction } from '../helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts',
    'language-services/i18n/File.ts',
]);

test('un changement des locales configurées recalcule diagnostics, correction et export i18n', async t => {
    const uri = 'file:///D:/round76/locales.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        '{"greeting":{"en":"Hello","fr":"Bonjour"},"farewell":{"en":"Bye","fr":"Au revoir"}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });

    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.exported.en, { greeting: 'Hello', farewell: 'Bye' });

    build.buildConfig.i18n.locales = ['en', 'de'];
    translation.transformForExport();
    const diagnostics = await source.validate(false);
    assert.deepEqual(diagnostics.filter(item => item.message === 'Missing locales de')
        .map(item => source.documentUser.getText(item.range)), ['"greeting"', '"farewell"']);
    assert.deepEqual(diagnostics.filter(item => item.message === 'Locale not needed')
        .map(item => source.documentUser.getText(item.range)), ['"fr"', '"fr"']);
    assert.deepEqual(translation.exported, {
        en: { greeting: 'Hello', farewell: 'Bye' }, de: {},
    });

    const actions = await source.getCodeAction(diagnostics[0].range);
    const edit = actions.find(item => item.title === 'Import missing locales')?.edit.changes[uri][0];
    assert.ok(edit);
    assert.deepEqual(parseI18nAction(source.documentUser, actions.find(item => item.title === 'Import missing locales')), {
        greeting: { en: 'Hello', de: 'ⵌⵌ', fr: 'Bonjour' },
        farewell: { en: 'Bye', de: 'ⵌⵌ', fr: 'Au revoir' },
    });

    await source.triggerContentChange(TextDocument.create(uri, 'json', 2,
        '{"greeting":{"en":"Hello","de":"Hallo"},"farewell":{"en":"Bye","de":"Tschüss"}}'));
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.exported.de, { greeting: 'Hallo', farewell: 'Tschüss' });
    assert.equal(translation.exported.fr, undefined);
});
