import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';
import { applyI18nAction } from './helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('les locales configurées passent de zéro à deux puis à zéro sans laisser de correction périmée', async t => {
    const uri = 'file:///D:/round263/config-empty.i18n.avt';
    const build = {
        buildConfig: { i18n: { locales: [], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        '{"first":{"en":"One"},"second":{}}'));
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });
    const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
    const messages = async () => (await source.validate(false)).map(diagnostic => diagnostic.message);
    const edit = (version, content) => source.triggerContentChange(
        TextDocument.create(uri, 'json', version, content));

    assert.deepEqual(await messages(), ['Locale not needed']);
    assert.deepEqual(translation.exported, {});
    assert.deepEqual(await source.getCodeAction(range), []);

    build.buildConfig.i18n.locales = ['en', 'fr'];
    await edit(2, source.contentUser);
    assert.deepEqual(await messages(), ['Missing locales fr', 'Missing locales en, fr']);
    assert.deepEqual(translation.exported, { en: { first: 'One' }, fr: {} });
    const [action] = await source.getCodeAction(range);
    assert.equal(action.title, 'Import missing locales');
    assert.equal(action.edit.changes[uri].length, 2);
    const completed = applyI18nAction(source.documentUser, action);
    assert.deepEqual(JSON.parse(completed), {
        first: { fr: 'ⵌⵌ', en: 'One' }, second: { en: 'ⵌⵌ', fr: 'ⵌⵌ' },
    });

    await edit(3, completed.replaceAll('ⵌⵌ', 'Done'));
    assert.deepEqual(await messages(), []);
    assert.deepEqual(await source.getCodeAction(range), []);
    assert.deepEqual(translation.exported, {
        en: { first: 'One', second: 'Done' },
        fr: { first: 'Done', second: 'Done' },
    });

    build.buildConfig.i18n.locales = [];
    await edit(4, source.contentUser);
    assert.deepEqual(await messages(), [
        'Locale not needed', 'Locale not needed', 'Locale not needed', 'Locale not needed',
    ]);
    assert.deepEqual(await source.getCodeAction(range), []);
    assert.deepEqual(translation.exported, {});
});
