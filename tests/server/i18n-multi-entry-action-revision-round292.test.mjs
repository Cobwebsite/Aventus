import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';
import { applyI18nAction } from './helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('missing locales in separate entries are edited together and recalculated after revisions', async t => {
    const uri = 'file:///D:/round292/multiple.i18n.avt';
    const document = (version, content) => TextDocument.create(uri, 'json', version, content);
    const source = new InternalAventusFile(document(1, [
        '{',
        '  "alpha": { "en": "Alpha" },',
        '  "beta": { "fr": "Bêta" }',
        '}',
    ].join('\n')));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });
    const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
    const diagnostics = async () => (await source.validate(false)).map(item => item.message).sort();

    assert.deepEqual(await diagnostics(), ['Missing locales en', 'Missing locales fr']);
    assert.deepEqual(translation.exported, { en: { alpha: 'Alpha' }, fr: { beta: 'Bêta' } });
    const [action] = await source.getCodeAction(range);
    assert.equal(action.title, 'Import missing locales');
    assert.equal(action.edit.changes[uri].length, 2);
    const completed = applyI18nAction(source.documentUser, action);
    assert.deepEqual(JSON.parse(completed), {
        alpha: { fr: 'ⵌⵌ', en: 'Alpha' },
        beta: { en: 'ⵌⵌ', fr: 'Bêta' },
    });

    await source.triggerContentChange(document(2, completed.replaceAll('ⵌⵌ', 'Translated')));
    assert.deepEqual(await diagnostics(), []);
    assert.deepEqual(await source.getCodeAction(range), []);
    assert.deepEqual(translation.exported, {
        en: { alpha: 'Alpha', beta: 'Translated' },
        fr: { alpha: 'Translated', beta: 'Bêta' },
    });

    await source.triggerContentChange(document(3, '{"beta":{"en":"Beta","fr":"Bêta"},"gamma":{}}'));
    assert.deepEqual(await diagnostics(), ['Missing locales en, fr']);
    assert.deepEqual(translation.keys, ['beta', 'gamma']);
    assert.deepEqual(translation.exported, { en: { beta: 'Beta' }, fr: { beta: 'Bêta' } });
    const [newAction] = await source.getCodeAction(range);
    assert.equal(newAction.edit.changes[uri].length, 1);
    assert.deepEqual(JSON.parse(applyI18nAction(source.documentUser, newAction)), {
        beta: { en: 'Beta', fr: 'Bêta' }, gamma: { en: 'ⵌⵌ', fr: 'ⵌⵌ' },
    });
});
