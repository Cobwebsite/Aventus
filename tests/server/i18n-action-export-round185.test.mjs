import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('la correction des locales manquantes suit les éditions et les exports i18n', async t => {
    const uri = 'file:///D:/round185/messages.i18n.avt';
    const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        '{"zeta":{"en":"Last"},"alpha":{"en":"First","fr":"Premier"}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });

    const missing = await source.validate(false);
    assert.deepEqual(missing.map(diagnostic => [diagnostic.message, source.documentUser.getText(diagnostic.range)]), [
        ['Missing locales fr', '"zeta"'],
    ]);
    assert.deepEqual(translation.exported, {
        en: { zeta: 'Last', alpha: 'First' }, fr: { alpha: 'Premier' },
    });

    const actions = await source.getCodeAction(range);
    assert.equal(actions.length, 1);
    const edit = actions[0].edit.changes[uri][0];
    assert.equal(source.documentUser.getText(edit.range), source.contentUser);
    assert.deepEqual(JSON.parse(edit.newText), {
        alpha: { en: 'First', fr: 'Premier' }, zeta: { en: 'Last', fr: 'ⵌⵌ' },
    });
    await source.triggerContentChange(TextDocument.create(uri, 'json', 2, edit.newText));
    assert.deepEqual((await source.validate(false)).map(diagnostic => [
        diagnostic.message, source.documentUser.getText(diagnostic.range),
    ]), [['Translation not set', '"ⵌⵌ"']]);
    assert.deepEqual(translation.exported.fr, { alpha: 'Premier', zeta: 'ⵌⵌ' });
    assert.deepEqual(await source.getCodeAction(range), []);

    await source.triggerContentChange(TextDocument.create(uri, 'json', 3,
        '{"alpha":{"fr":"Premier","en":"First"},"zeta":{"fr":"Dernier","en":"Last"}}'));
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.exported.fr, { alpha: 'Premier', zeta: 'Dernier' });
    assert.deepEqual(await source.getCodeAction(range), []);

    const formatted = await source.getFormatting({});
    assert.equal(formatted.length, 1);
    assert.deepEqual(Object.keys(JSON.parse(formatted[0].newText)), ['alpha', 'zeta']);
    assert.deepEqual(Object.keys(JSON.parse(formatted[0].newText).zeta), ['en', 'fr']);
});
