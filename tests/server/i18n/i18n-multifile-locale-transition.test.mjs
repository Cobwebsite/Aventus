import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';
import { applyI18nAction } from '../helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('une transition des locales recompose indépendamment diagnostics, corrections, exports et formatage de deux fichiers', async t => {
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const create = (name, content) => {
        const uri = `file:///D:/round176/${name}.i18n.avt`;
        const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, content));
        const translation = new AventusI18nFile(source, true, build);
        build.tsLanguageService.i18nFiles[uri] = translation;
        return { uri, source, translation, edit: (version, text) => source.triggerContentChange(TextDocument.create(uri, 'json', version, text)) };
    };
    const first = create('first', '{"zeta":{"fr":"Un","en":"One"}}');
    const second = create('second', '{"alpha":{"en":"Two","fr":"Deux","de":"Zwei"}}');
    t.after(async () => {
        for (const item of [first, second]) {
            clearTimeout(item.source.delayValidate);
            await item.source.triggerDelete();
        }
    });

    assert.deepEqual((await first.source.validate(false)).map(d => d.message), []);
    assert.deepEqual((await second.source.validate(false)).map(d => d.message), ['Locale not needed']);
    assert.deepEqual(first.translation.exported, { en: { zeta: 'One' }, fr: { zeta: 'Un' } });
    assert.deepEqual(second.translation.exported, { en: { alpha: 'Two' }, fr: { alpha: 'Deux' } });

    build.buildConfig.i18n.locales = ['en', 'de'];
    await first.edit(2, '{"zeta":{"fr":"Un","en":"One"}}');
    await second.edit(2, '{"alpha":{"en":"Two","fr":"Deux","de":"Zwei"}}');
    assert.deepEqual((await first.source.validate(false)).map(d => d.message).sort(), ['Locale not needed', 'Missing locales de'].sort());
    assert.deepEqual((await second.source.validate(false)).map(d => d.message), ['Locale not needed']);
    assert.deepEqual(first.translation.exported, { en: { zeta: 'One' }, de: {} });
    assert.deepEqual(second.translation.exported, { en: { alpha: 'Two' }, de: { alpha: 'Zwei' } });

    const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
    const actions = await first.source.getCodeAction(range);
    assert.equal(actions.length, 1);
    assert.equal(actions[0].title, 'Import missing locales');
    const replacement = applyI18nAction(first.source.documentUser, actions[0]);
    assert.deepEqual(JSON.parse(replacement), { zeta: { de: 'ⵌⵌ', en: 'One', fr: 'Un' } });
    assert.deepEqual(await second.source.getCodeAction(range), []);

    await first.edit(3, replacement.replace('ⵌⵌ', 'Eins'));
    assert.deepEqual((await first.source.validate(false)).map(d => d.message), ['Locale not needed']);
    assert.deepEqual(first.translation.exported, { en: { zeta: 'One' }, de: { zeta: 'Eins' } });
    assert.deepEqual(second.translation.exported, { en: { alpha: 'Two' }, de: { alpha: 'Zwei' } });
    const formatted = await first.source.getFormatting({ tabSize: 4, insertSpaces: true });
    assert.equal(formatted.length, 1);
    assert.deepEqual(JSON.parse(formatted[0].newText), JSON.parse(first.source.contentUser));
    assert.ok(formatted[0].newText.indexOf('"de"') < formatted[0].newText.indexOf('"en"'));
    assert.ok(formatted[0].newText.indexOf('"en"') < formatted[0].newText.indexOf('"fr"'));
});
