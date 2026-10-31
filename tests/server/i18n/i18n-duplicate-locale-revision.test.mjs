import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('un doublon de locale suit les editions sans conserver son diagnostic ni sa traduction', async t => {
    const uri = 'file:///D:/round239/duplicates.i18n.avt';
    const document = (version, content) => TextDocument.create(uri, 'json', version, content);
    const source = new InternalAventusFile(document(1, '{\n  "title": {"en":"First","en":"Last"}\n}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => { clearTimeout(source.delayValidate); await source.triggerDelete(); });

    const diagnostics = async () => (await source.validate(false)).map(item => [
        item.message, source.documentUser.getText(item.range), item.range.start.line,
    ]);
    assert.deepEqual(await diagnostics(), [
        ['Duplicate object key', '"en"', 1],
        ['Duplicate object key', '"en"', 1],
    ]);
    assert.deepEqual(translation.exported, { en: { title: 'Last' }, fr: {} });
    assert.equal(translation.parsed.title.locales.en.value, 'Last');

    const range = { start: { line: 1, character: 2 }, end: { line: 1, character: 9 } };
    assert.deepEqual(await source.getCodeAction(range), []);

    await source.triggerContentChange(document(2, '{\n  "title": {"en":"Only","fr":"Unique"}\n}'));
    assert.deepEqual(await diagnostics(), []);
    assert.deepEqual(await source.getCodeAction(range), []);
    assert.deepEqual(translation.exported, { en: { title: 'Only' }, fr: { title: 'Unique' } });

    await source.triggerContentChange(document(3, '{\n\n  "title": {"fr":"Un","fr":"Deux","en":"Final"}\n}'));
    assert.deepEqual(await diagnostics(), [
        ['Duplicate object key', '"fr"', 2],
        ['Duplicate object key', '"fr"', 2],
    ]);
    assert.deepEqual(translation.exported, { en: { title: 'Final' }, fr: { title: 'Deux' } });
    assert.equal(translation.parsed.title.locales.fr.value, 'Deux');
});
