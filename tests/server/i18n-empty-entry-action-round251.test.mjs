import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';
import { applyI18nAction } from './helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('une traduction vide reçoit toutes les locales en JSON compact puis multiligne', async t => {
    const uri = 'file:///D:/round251/empty-entry.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, '{"blank":{}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });
    const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
    const edit = (version, content) => source.triggerContentChange(
        TextDocument.create(uri, 'json', version, content));
    const messages = async () => (await source.validate(false)).map(diagnostic => diagnostic.message);

    assert.deepEqual(await messages(), ['Missing locales en, fr']);
    assert.deepEqual(translation.exported, { en: {}, fr: {} });
    const [compactAction] = await source.getCodeAction(range);
    assert.equal(compactAction.title, 'Import missing locales');
    const compact = applyI18nAction(source.documentUser, compactAction);
    assert.deepEqual(JSON.parse(compact), { blank: { en: 'ⵌⵌ', fr: 'ⵌⵌ' } });
    await edit(2, compact);
    assert.deepEqual(await messages(), ['Translation not set', 'Translation not set']);
    assert.deepEqual(await source.getCodeAction(range), []);

    await edit(3, '{\n  "blank": {\n  }\n}');
    assert.deepEqual(await messages(), ['Missing locales en, fr']);
    const [multilineAction] = await source.getCodeAction(range);
    const multiline = applyI18nAction(source.documentUser, multilineAction);
    assert.deepEqual(JSON.parse(multiline), { blank: { en: 'ⵌⵌ', fr: 'ⵌⵌ' } });
    await edit(4, multiline.replaceAll('ⵌⵌ', 'Ready'));
    assert.deepEqual(await messages(), []);
    assert.deepEqual(translation.exported, {
        en: { blank: 'Ready' }, fr: { blank: 'Ready' },
    });
});
