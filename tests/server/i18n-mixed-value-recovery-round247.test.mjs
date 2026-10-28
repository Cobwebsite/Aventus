import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';
import { parseI18nAction } from './helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('valeurs de traduction structurées : diagnostics, action ciblée et récupération après édition', async t => {
    const uri = 'file:///D:/round247/mixed-values.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        '{"array":{"en":["one"]},"object":{"en":{"text":"Two"}},"valid":{"en":"Three"}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => { clearTimeout(source.delayValidate); await source.triggerDelete(); });
    const change = (version, content) => source.triggerContentChange(
        TextDocument.create(uri, 'json', version, content));

    const before = await source.validate(false);
    assert.equal(before.filter(d => d.message.includes('Incorrect type')).length, 2);
    assert.deepEqual(before.filter(d => d.message.startsWith('Missing locales')).map(d => source.documentUser.getText(d.range)),
        ['"array"', '"object"', '"valid"']);
    assert.deepEqual(translation.exported, {
        en: { array: ['one'], object: { text: 'Two' }, valid: 'Three' }, fr: {},
    });
    const action = (await source.getCodeAction({
        start: { line: 0, character: 1 }, end: { line: 0, character: 8 },
    }))[0];
    assert.deepEqual(parseI18nAction(source.documentUser, action), {
        array: { en: ['one'], fr: 'ⵌⵌ' },
        object: { en: { text: 'Two' }, fr: 'ⵌⵌ' },
        valid: { en: 'Three', fr: 'ⵌⵌ' },
    });

    await change(2, '{"array":{"en":"One","fr":"Un"},"object":{"en":"Two","fr":"Deux"},"valid":{"en":"Three","fr":"Trois"}}');
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(await source.getCodeAction({
        start: { line: 0, character: 1 }, end: { line: 0, character: 8 },
    }), []);
    assert.deepEqual(translation.exported, {
        en: { array: 'One', object: 'Two', valid: 'Three' },
        fr: { array: 'Un', object: 'Deux', valid: 'Trois' },
    });
});
