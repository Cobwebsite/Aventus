import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('les doublons entre fichiers i18n suivent renommage, réintroduction et retrait', async t => {
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const entries = [
        ['first', '{"shared":{"en":"One","fr":"Un"}}'],
        ['second', '{"shared":{"en":"Two","fr":"Deux"}}'],
        ['third', '{"other":{"en":"Three","fr":"Trois"}}'],
    ];
    const files = entries.map(([name, content]) => {
        const uri = `file:///D:/round172/${name}.i18n.avt`;
        const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, content));
        const translation = new AventusI18nFile(source, true, build);
        build.tsLanguageService.i18nFiles[uri] = translation;
        return { source, translation, change: (version, text) => source.triggerContentChange(TextDocument.create(uri, 'json', version, text)) };
    });
    t.after(async () => {
        for (const { source } of files) {
            clearTimeout(source.delayValidate);
            await source.triggerDelete();
        }
    });
    const [first, second, third] = files;
    const duplicateKeys = async item => {
        const diagnostics = await item.source.validate(false);
        return diagnostics.filter(diagnostic => diagnostic.message.startsWith('Duplicate translation key '))
            .map(diagnostic => item.source.documentUser.getText(diagnostic.range));
    };

    assert.deepEqual(await duplicateKeys(first), ['"shared"']);
    assert.deepEqual(await duplicateKeys(second), ['"shared"']);
    assert.deepEqual(await duplicateKeys(third), []);

    await second.change(2, '{"renamed":{"en":"Two","fr":"Deux"}}');
    assert.deepEqual(await duplicateKeys(first), []);
    assert.deepEqual(await duplicateKeys(second), []);
    assert.deepEqual(second.translation.exported.en, { renamed: 'Two' });

    await third.change(2, '{"shared":{"en":"Three","fr":"Trois"}}');
    assert.deepEqual(await duplicateKeys(first), ['"shared"']);
    assert.deepEqual(await duplicateKeys(third), ['"shared"']);
    assert.deepEqual(await duplicateKeys(second), []);

    await third.change(3, '{}');
    assert.deepEqual(await duplicateKeys(first), []);
    assert.deepEqual(await duplicateKeys(third), []);
    assert.deepEqual(third.translation.exported, { en: {}, fr: {} });
});
