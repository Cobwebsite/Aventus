import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';
import { parseI18nAction } from './helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('an astral i18n key keeps UTF-16 ranges across edits and locale repair', async t => {
    const uri = 'file:///D:/round272/astral.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        '{\n  "🚀ready": {"en":"Ready"}\n}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });
    const missing = async () => (await source.validate(false))
        .filter(item => item.message === 'Missing locales fr');

    let [diagnostic] = await missing();
    assert.ok(diagnostic);
    assert.equal(source.documentUser.getText(diagnostic.range), '"🚀ready"');
    assert.equal(diagnostic.range.end.character - diagnostic.range.start.character, '"🚀ready"'.length);
    assert.equal(translation.getKeyFromLocation([
        { line: 1, character: 4 }, { line: 1, character: 5 },
    ]), '🚀ready');
    assert.deepEqual(parseI18nAction(source.documentUser,
        (await source.getCodeAction(diagnostic.range))[0]), {
        '🚀ready': { en: 'Ready', fr: 'ⵌⵌ' },
    });

    await source.triggerContentChange(TextDocument.create(uri, 'json', 2,
        '{\n\n  "🚀ready": {"en":"Ready", "fr":"Prêt"}\n}'));
    assert.deepEqual(await missing(), []);
    assert.deepEqual(translation.exported, {
        en: { '🚀ready': 'Ready' }, fr: { '🚀ready': 'Prêt' },
    });

    await source.triggerContentChange(TextDocument.create(uri, 'json', 3,
        '{\n  "✨done": {"en":"Done"}\n}'));
    [diagnostic] = await missing();
    assert.equal(source.documentUser.getText(diagnostic.range), '"✨done"');
    assert.deepEqual(translation.keys, ['✨done']);
    assert.deepEqual(translation.exported, { en: { '✨done': 'Done' }, fr: {} });
});
