import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('une recherche de clé i18n ignore les positions périmées pendant une édition invalide', async t => {
    const uri = 'file:///D:/round220/position.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, '{"old":{"en":"Old","fr":"Ancien"}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => { clearTimeout(source.delayValidate); await source.triggerDelete(); });
    const position = { line: 0, character: 3 };
    assert.equal(translation.getKeyFromLocation([position, position]), 'old');

    await source.triggerContentChange(TextDocument.create(uri, 'json', 2, '{"new":'));
    assert.ok((await source.validate(false)).length > 0);
    assert.equal(translation.getKeyFromLocation([position, position]), null);

    await source.triggerContentChange(TextDocument.create(uri, 'json', 3, '{"new":{"en":"New","fr":"Nouveau"}}'));
    assert.deepEqual(await source.validate(false), []);
    assert.equal(translation.getKeyFromLocation([position, position]), 'new');
    assert.deepEqual(translation.exported, { en: { new: 'New' }, fr: { new: 'Nouveau' } });
});
