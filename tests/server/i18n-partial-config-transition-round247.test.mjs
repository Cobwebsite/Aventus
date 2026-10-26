import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';
import { parseI18nAction } from './helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('transition des locales de deux fichiers : diagnostics et exports actualisés sans éditer chaque fichier', async t => {
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const entries = [];
    const makeFile = (name, content) => {
        const uri = `file:///D:/round247/${name}.i18n.avt`;
        const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, content));
        const translation = new AventusI18nFile(source, true, build);
        build.tsLanguageService.i18nFiles[uri] = translation;
        const entry = { source, translation, edit: (version, next) => source.triggerContentChange(
            TextDocument.create(uri, 'json', version, next)) };
        entries.push(entry);
        return entry;
    };
    const first = makeFile('config-first', '{"first":{"en":"First","fr":"Premier"}}');
    const second = makeFile('config-second', '{"second":{"en":"Second","fr":"Deuxième"}}');
    t.after(async () => {
        for (const { source } of entries) {
            clearTimeout(source.delayValidate);
            await source.triggerDelete();
        }
    });
    assert.deepEqual(await first.source.validate(false), []);
    assert.deepEqual(await second.source.validate(false), []);

    build.buildConfig.i18n.locales = ['en', 'de'];
    assert.deepEqual(second.translation.exported, { en: { second: 'Second' }, de: {} });
    await first.edit(2, '{"first":{"en":"First","de":"Erste"}}');
    assert.deepEqual(await first.source.validate(false), []);
    assert.deepEqual((await second.source.validate(false)).map(d => d.message),
        ['Locale not needed', 'Missing locales de']);
    assert.deepEqual(first.translation.exported, { en: { first: 'First' }, de: { first: 'Erste' } });
    assert.deepEqual(second.translation.exported, { en: { second: 'Second' }, de: {} });
    const action = (await second.source.getCodeAction({
        start: { line: 0, character: 1 }, end: { line: 0, character: 9 },
    }))[0];
    assert.deepEqual(parseI18nAction(second.source.documentUser, action), {
        second: { en: 'Second', fr: 'Deuxième', de: 'ⵌⵌ' },
    });

    await second.edit(2, '{"second":{"en":"Second","de":"Zweite"}}');
    assert.deepEqual(await second.source.validate(false), []);
    assert.deepEqual(second.translation.exported, { en: { second: 'Second' }, de: { second: 'Zweite' } });
    assert.deepEqual(await first.source.validate(false), []);
});
