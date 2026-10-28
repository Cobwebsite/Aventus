import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('une édition i18n invalide conserve les exports précédents puis une correction les remplace', async t => {
    const uri = 'file:///D:/round148/messages.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        '{"old":{"en":"Old","fr":"Ancien"}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });

    assert.deepEqual(translation.exported, {
        en: { old: 'Old' }, fr: { old: 'Ancien' },
    });
    assert.match(source.documentInternal.getText(), /"old": string/);

    await source.triggerContentChange(TextDocument.create(uri, 'json', 2,
        '{"new":{"en":"New","fr":'));
    assert.ok((await source.validate(false)).length > 0);
    assert.deepEqual(translation.keys, ['old']);
    assert.deepEqual(translation.exported, {
        en: { old: 'Old' }, fr: { old: 'Ancien' },
    });
    assert.equal(source.documentInternal.getText(), source.documentUser.getText());

    await source.triggerContentChange(TextDocument.create(uri, 'json', 3,
        '{"new":{"en":"New","fr":"Nouveau"}}'));
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.keys, ['new']);
    assert.deepEqual(translation.exported, {
        en: { new: 'New' }, fr: { new: 'Nouveau' },
    });
    assert.match(source.documentInternal.getText(), /"new": string/);
    assert.doesNotMatch(source.documentInternal.getText(), /"old": string/);
});
