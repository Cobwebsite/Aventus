import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('le retrait de toutes les clés i18n purge les exports puis une nouvelle clé les rétablit', async t => {
    const uri = 'file:///D:/round149/empty-recovery.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        '{"first":{"en":"One","fr":"Un"},"second":{"en":"Two","fr":"Deux"}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });
    assert.deepEqual(translation.keys, ['first', 'second']);
    assert.deepEqual(translation.exported, {
        en: { first: 'One', second: 'Two' }, fr: { first: 'Un', second: 'Deux' },
    });

    await source.triggerContentChange(TextDocument.create(uri, 'json', 2, '{}'));
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.keys, []);
    assert.deepEqual(translation.exported, { en: {}, fr: {} });
    assert.doesNotMatch(source.documentInternal.getText(), /"first"|"second"/);

    await source.triggerContentChange(TextDocument.create(uri, 'json', 3,
        '{"last":{"en":"Last","fr":"Dernier"}}'));
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.keys, ['last']);
    assert.deepEqual(translation.exported, { en: { last: 'Last' }, fr: { last: 'Dernier' } });
    assert.match(source.documentInternal.getText(), /"last": string/);
    assert.doesNotMatch(source.documentInternal.getText(), /"first"|"second"/);
});
