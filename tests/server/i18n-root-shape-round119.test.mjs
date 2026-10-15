import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('i18n keeps an empty key list for a null root and recovers after a valid edit', async () => {
    const uri = 'file:///D:/round119/messages.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        '{"message":{"en":"Old","fr":"Ancien"}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    try {
        assert.deepEqual(translation.keys, ['message']);
        await source.triggerContentChange(TextDocument.create(uri, 'json', 2, 'null'));
        assert.ok((await source.validate(false)).length > 0);
        assert.deepEqual(translation.keys, []);
        assert.deepEqual(translation.exported, { en: {}, fr: {} });

        await source.triggerContentChange(TextDocument.create(uri, 'json', 3,
            '{"replacement":{"en":"New","fr":"Nouveau"}}'));
        assert.deepEqual(await source.validate(false), []);
        assert.deepEqual(translation.keys, ['replacement']);
        assert.deepEqual(translation.exported, {
            en: { replacement: 'New' }, fr: { replacement: 'Nouveau' },
        });
    } finally {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    }
});
