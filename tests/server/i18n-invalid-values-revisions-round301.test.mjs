import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';
import { parseI18nAction } from './helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('invalid translation types and missing locales recover over successive edits', async t => {
    const uri = 'file:///D:/round301/values.i18n.avt';
    const document = (version, content) => TextDocument.create(uri, 'json', version, content);
    const source = new InternalAventusFile(document(1,
        '{"first":{"en":true},"second":{"en":null},"third":{"en":["x"]}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });
    const diagnostics = async () => (await source.validate(false)).map(item => [
        item.message, source.documentUser.getText(item.range),
    ]);

    assert.deepEqual(await diagnostics(), [
        ['Incorrect type. Expected "string".', 'true'],
        ['Incorrect type. Expected "string".', 'null'],
        ['Incorrect type. Expected "string".', '["x"]'],
        ['Missing locales fr', '"first"'],
        ['Missing locales fr', '"second"'],
        ['Missing locales fr', '"third"'],
    ]);
    assert.deepEqual(translation.exported, {
        en: { first: true, second: null, third: ['x'] }, fr: {},
    });
    const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
    const [action] = await source.getCodeAction(range);
    assert.deepEqual(parseI18nAction(source.documentUser, action), {
        first: { en: true, fr: 'ⵌⵌ' },
        second: { en: null, fr: 'ⵌⵌ' },
        third: { en: ['x'], fr: 'ⵌⵌ' },
    });

    await source.triggerContentChange(document(2,
        '{"first":{"en":"Yes","fr":"Oui"},"second":{"en":false,"fr":"Non"}}'));
    assert.deepEqual(await diagnostics(), [
        ['Incorrect type. Expected "string".', 'false'],
    ]);
    assert.deepEqual(translation.exported, {
        en: { first: 'Yes', second: false }, fr: { first: 'Oui', second: 'Non' },
    });

    await source.triggerContentChange(document(3,
        '{"second":{"en":"No","fr":"Non"}}'));
    assert.deepEqual(await diagnostics(), []);
    assert.deepEqual(translation.exported, {
        en: { second: 'No' }, fr: { second: 'Non' },
    });
    assert.deepEqual(await source.getCodeAction(range), []);
});
