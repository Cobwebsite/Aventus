import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts',
    'language-services/i18n/File.ts',
]);

test('un JSON i18n invalide garde les valeurs précédentes jusqu’à une correction', async () => {
    const uri = 'file:///D:/round57/messages.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        '{"message":{"en":"Old","fr":"Ancien"}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    try {
        assert.deepEqual(translation.exported, {
            en: { message: 'Old' }, fr: { message: 'Ancien' },
        });

        await source.triggerContentChange(TextDocument.create(uri, 'json', 2,
            '{"message":{"en":"New","fr":'));
        assert.ok((await source.validate(false)).length > 0);
        assert.deepEqual(translation.exported, {
            en: { message: 'Old' }, fr: { message: 'Ancien' },
        });
        assert.deepEqual(translation.keys, ['message']);

        await source.triggerContentChange(TextDocument.create(uri, 'json', 3,
            '{"replacement":{"en":"New","fr":"Nouveau"}}'));
        assert.deepEqual(await source.validate(false), []);
        assert.deepEqual(translation.exported, {
            en: { replacement: 'New' }, fr: { replacement: 'Nouveau' },
        });
        assert.deepEqual(translation.keys, ['replacement']);
    } finally {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    }
});
