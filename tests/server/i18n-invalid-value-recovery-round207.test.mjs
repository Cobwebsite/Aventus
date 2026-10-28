import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';
import { parseI18nAction } from './helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('une traduction numérique et une locale absente suivent correction et nouvelle édition', async t => {
    const uri = 'file:///D:/round207/value.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        '{\n  "amount": {"en": 12}\n}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });

    const details = async () => (await source.validate(false)).map(item => [
        item.message, source.documentUser.getText(item.range), item.severity,
    ]);
    assert.deepEqual(await details(), [
        ['Incorrect type. Expected "string".', '12', 2],
        ['Missing locales fr', '"amount"', 1],
    ]);
    assert.deepEqual(translation.exported, { en: { amount: 12 }, fr: {} });
    const action = (await source.getCodeAction({
        start: { line: 1, character: 2 }, end: { line: 1, character: 10 },
    }))[0];
    assert.deepEqual(parseI18nAction(source.documentUser, action), {
        amount: { en: 12, fr: 'ⵌⵌ' },
    });

    await source.triggerContentChange(TextDocument.create(uri, 'json', 2,
        '{\n\n  "amount": {"en": "Twelve", "fr": "Douze"}\n}'));
    assert.deepEqual(await details(), []);
    assert.deepEqual(await source.getCodeAction({
        start: { line: 2, character: 2 }, end: { line: 2, character: 10 },
    }), []);
    assert.deepEqual(translation.exported, {
        en: { amount: 'Twelve' }, fr: { amount: 'Douze' },
    });

    await source.triggerContentChange(TextDocument.create(uri, 'json', 3,
        '{"amount":{"en":"Thirteen"}}'));
    assert.deepEqual(await details(), [['Missing locales fr', '"amount"', 1]]);
    assert.deepEqual(translation.exported, { en: { amount: 'Thirteen' }, fr: {} });
    assert.deepEqual(parseI18nAction(source.documentUser, (await source.getCodeAction({
        start: { line: 0, character: 1 }, end: { line: 0, character: 9 },
    }))[0]), {
        amount: { en: 'Thirteen', fr: 'ⵌⵌ' },
    });
});
