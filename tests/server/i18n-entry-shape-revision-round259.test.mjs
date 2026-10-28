import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';
import { applyI18nAction } from './helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('une entrée i18n de forme invalide devient traduisible après deux révisions', async t => {
    const uri = 'file:///D:/round259/entry-shape.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        '{"ready":{"en":"Ready","fr":"Prêt"},"draft":"plain"}'));
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
    const diagnostics = async () => (await source.validate(false)).map(item => item.message);
    const edit = (version, content) => source.triggerContentChange(
        TextDocument.create(uri, 'json', version, content));

    assert.equal((await diagnostics()).length, 1);
    assert.deepEqual(translation.keys, ['ready', 'draft']);
    assert.deepEqual(translation.exported, {
        en: { ready: 'Ready' }, fr: { ready: 'Prêt' },
    });
    assert.deepEqual(await source.getCodeAction(range), []);

    await edit(2, '{"ready":{"en":"Ready","fr":"Prêt"},"draft":{"en":"Draft"}}');
    assert.deepEqual(await diagnostics(), ['Missing locales fr']);
    assert.deepEqual(translation.exported, {
        en: { ready: 'Ready', draft: 'Draft' }, fr: { ready: 'Prêt' },
    });
    const [action] = await source.getCodeAction(range);
    assert.equal(action.title, 'Import missing locales');
    const completed = applyI18nAction(source.documentUser, action);
    assert.deepEqual(JSON.parse(completed), {
        ready: { en: 'Ready', fr: 'Prêt' }, draft: { fr: 'ⵌⵌ', en: 'Draft' },
    });

    await edit(3, completed.replace('ⵌⵌ', 'Brouillon'));
    assert.deepEqual(await diagnostics(), []);
    assert.deepEqual(await source.getCodeAction(range), []);
    assert.deepEqual(translation.exported, {
        en: { ready: 'Ready', draft: 'Draft' },
        fr: { ready: 'Prêt', draft: 'Brouillon' },
    });
});
