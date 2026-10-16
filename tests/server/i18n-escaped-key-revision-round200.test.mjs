import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';
import { parseI18nAction } from './helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('une clé JSON échappée renouvelle sa plage, sa correction et son export après édition', async t => {
    const uri = 'file:///D:/round200/escaped.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        '{\n  "caf\\u00e9": {"en":"Coffee"}\n}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });

    const missing = async () => (await source.validate(false)).filter(item => item.message === 'Missing locales fr');
    let diagnostics = await missing();
    assert.equal(diagnostics.length, 1);
    assert.equal(source.documentUser.getText(diagnostics[0].range), '"caf\\u00e9"');
    assert.deepEqual(translation.exported, { en: { 'café': 'Coffee' }, fr: {} });
    const firstAction = (await source.getCodeAction(diagnostics[0].range))[0];
    assert.deepEqual(parseI18nAction(source.documentUser, firstAction), {
        'café': { en: 'Coffee', fr: 'ⵌⵌ' },
    });

    await source.triggerContentChange(TextDocument.create(uri, 'json', 2,
        '{\n\n  "caf\\u00e9": {"en":"Coffee", "fr":"Café"}\n}'));
    assert.deepEqual(await missing(), []);
    assert.deepEqual(await source.getCodeAction({ start: { line: 2, character: 2 }, end: { line: 2, character: 13 } }), []);
    assert.deepEqual(translation.exported, { en: { 'café': 'Coffee' }, fr: { 'café': 'Café' } });

    await source.triggerContentChange(TextDocument.create(uri, 'json', 3,
        '{\n  "tea": {"en":"Tea"}\n}'));
    diagnostics = await missing();
    assert.equal(diagnostics.length, 1);
    assert.equal(source.documentUser.getText(diagnostics[0].range), '"tea"');
    assert.deepEqual(translation.exported, { en: { tea: 'Tea' }, fr: {} });
    assert.deepEqual(parseI18nAction(source.documentUser, (await source.getCodeAction(diagnostics[0].range))[0]), {
        tea: { en: 'Tea', fr: 'ⵌⵌ' },
    });
});
