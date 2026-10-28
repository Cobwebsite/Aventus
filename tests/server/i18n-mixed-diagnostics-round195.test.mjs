import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';
import { parseI18nAction } from './helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('trois diagnostics i18n indépendants suivent les éditions et leurs plages', async t => {
    const uri = 'file:///D:/round195/mixed.i18n.avt';
    const initial = '{\n  "first": {"en":"One","de":"Eins"},\n  "second": {"en":"ⵌⵌ","fr":"Deux"}\n}';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, initial));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });
    const observed = async () => (await source.validate(false)).map(item => [
        item.message,
        source.documentUser.getText(item.range),
        item.range.start.line,
        item.severity,
    ]);

    assert.deepEqual(await observed(), [
        ['Locale not needed', '"de"', 1, 2],
        ['Missing locales fr', '"first"', 1, 1],
        ['Translation not set', '"ⵌⵌ"', 2, 2],
    ]);
    const firstAction = await source.getCodeAction({ start: { line: 1, character: 2 }, end: { line: 1, character: 9 } });
    assert.deepEqual(parseI18nAction(source.documentUser, firstAction[0]), {
        first: { en: 'One', de: 'Eins', fr: 'ⵌⵌ' },
        second: { en: 'ⵌⵌ', fr: 'Deux' },
    });

    await source.triggerContentChange(TextDocument.create(uri, 'json', 2,
        '{\n\n  "first": {"en":"One","fr":"Un"},\n  "second": {"en":"ⵌⵌ","fr":"Deux"}\n}'));
    assert.deepEqual(await observed(), [['Translation not set', '"ⵌⵌ"', 3, 2]]);
    assert.deepEqual(await source.getCodeAction({ start: { line: 3, character: 2 }, end: { line: 3, character: 10 } }), []);

    await source.triggerContentChange(TextDocument.create(uri, 'json', 3,
        '{\n  "first": {"en":"One","fr":"Un"},\n  "second": {"en":"Two","fr":"Deux"}\n}'));
    assert.deepEqual(await observed(), []);
    assert.deepEqual(translation.exported, { en: { first: 'One', second: 'Two' }, fr: { first: 'Un', second: 'Deux' } });
});
