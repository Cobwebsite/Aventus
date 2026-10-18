import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('escaped and literal spellings of the same i18n key follow duplicate removal', async t => {
    const uri = 'file:///D:/round277/escaped-duplicate.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        '{\n  "café": {"en":"First", "fr":"Premier"},\n  "caf\\u00e9": {"en":"Second", "fr":"Secondaire"}\n}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });
    const duplicate = async () => (await source.validate(false))
        .filter(item => /duplicate/i.test(item.message));

    assert.deepEqual(translation.keys, ['café']);
    assert.deepEqual(translation.exported, {
        en: { café: 'Second' }, fr: { café: 'Secondaire' },
    });
    const errors = await duplicate();
    assert.ok(errors.length > 0);
    assert.ok(errors.some(item => source.documentUser.getText(item.range) === '"caf\\u00e9"'));

    await source.triggerContentChange(TextDocument.create(uri, 'json', 2,
        '{\n  "café": {"en":"First", "fr":"Premier"}\n}'));
    assert.deepEqual(await duplicate(), []);
    assert.deepEqual(translation.exported, {
        en: { café: 'First' }, fr: { café: 'Premier' },
    });
});
