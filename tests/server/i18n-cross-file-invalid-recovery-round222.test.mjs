import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('les diagnostics de doublon entre fichiers suivent une édition invalide puis sa réparation', async t => {
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const makeFile = (name, text) => {
        const uri = `file:///D:/round222/${name}.i18n.avt`;
        const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, text));
        const translation = new AventusI18nFile(source, true, build);
        build.tsLanguageService.i18nFiles[uri] = translation;
        return { source, translation, uri };
    };
    const first = makeFile('first', '{"shared":{"en":"One","fr":"Un"}}');
    const second = makeFile('second', '{"shared":{"en":"Two","fr":"Deux"}}');
    t.after(async () => {
        for (const { source } of [first, second]) {
            clearTimeout(source.delayValidate);
            await source.triggerDelete();
        }
    });
    const messages = async item => (await item.source.validate(false)).map(diagnostic => diagnostic.message);
    const editSecond = (version, text) => second.source.triggerContentChange(TextDocument.create(second.uri, 'json', version, text));

    assert.deepEqual(await messages(first), ['Duplicate translation key shared across global files']);
    assert.deepEqual(await messages(second), ['Duplicate translation key shared across global files']);

    await editSecond(2, '{"replacement":');
    assert.ok((await messages(second)).some(message => /parse|value|expected/i.test(message)));
    assert.deepEqual(await messages(first), []);
    assert.deepEqual(second.translation.keys, ['shared']);
    assert.equal(second.translation.parsed, undefined);
    assert.deepEqual(second.translation.exported, { en: { shared: 'Two' }, fr: { shared: 'Deux' } });

    await editSecond(3, '{"replacement":{"en":"Three","fr":"Trois"}}');
    assert.deepEqual(await messages(first), []);
    assert.deepEqual(await messages(second), []);
    assert.deepEqual(second.translation.keys, ['replacement']);
    assert.deepEqual(second.translation.exported, { en: { replacement: 'Three' }, fr: { replacement: 'Trois' } });
});
