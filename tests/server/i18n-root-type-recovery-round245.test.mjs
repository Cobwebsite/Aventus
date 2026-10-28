import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('une racine i18n tableau ou primitive vide les exports puis une racine objet les restaure', async t => {
    const uri = 'file:///D:/round245/root-type.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        '{"before":{"en":"Before","fr":"Avant"}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });
    const edit = (version, content) => source.triggerContentChange(
        TextDocument.create(uri, 'json', version, content));
    const expectedEmpty = { en: {}, fr: {} };

    assert.deepEqual(translation.exported, {
        en: { before: 'Before' }, fr: { before: 'Avant' },
    });

    await edit(2, '[]');
    assert.deepEqual(translation.keys, []);
    assert.deepEqual(translation.exported, expectedEmpty);
    assert.equal(translation.getKeyFromLocation([
        { line: 0, character: 0 }, { line: 0, character: 1 },
    ]), null);
    assert.doesNotMatch(source.documentInternal.getText(), /"before": string/);
    assert.ok((await source.validate(false)).some(d => /Incorrect type|object/i.test(d.message)));

    await edit(3, 'null');
    assert.deepEqual(translation.keys, []);
    assert.deepEqual(translation.exported, expectedEmpty);
    assert.equal(translation.getKeyFromLocation([
        { line: 0, character: 0 }, { line: 0, character: 1 },
    ]), null);
    assert.doesNotMatch(source.documentInternal.getText(), /"before": string/);
    assert.ok((await source.validate(false)).length > 0);

    await edit(4, '{"after":{"en":"After","fr":"Après"}}');
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.keys, ['after']);
    assert.deepEqual(translation.exported, {
        en: { after: 'After' }, fr: { after: 'Après' },
    });
    assert.match(source.documentInternal.getText(), /"after": string/);
    assert.doesNotMatch(source.documentInternal.getText(), /"before": string/);
});
