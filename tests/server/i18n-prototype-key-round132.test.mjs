import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts',
    'language-services/i18n/File.ts',
]);

test('une clé i18n __proto__ est refusée sans masquer les traductions valides', async t => {
    const uri = 'file:///D:/round132/messages.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, '{"normal":{"en":"First","fr":"Premier"}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });

    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.exported.en, { normal: 'First' });

    await source.triggerContentChange(TextDocument.create(uri, 'json', 2, '{"__proto__":{"en":"Second","fr":"Deuxième"},"valid":{"en":"Valid","fr":"Valide"}}'));
    assert.deepEqual(translation.keys, ['valid']);
    assert.deepEqual(Object.keys(translation.parsed), ['valid']);
    assert.equal(translation.getKeyFromLocation([{ line: 0, character: 3 }, { line: 0, character: 3 }]), null);
    assert.equal(Object.hasOwn(translation.exported.en, '__proto__'), false);
    assert.equal(translation.exported.en.valid, 'Valid');
    const diagnostics = await source.validate(false);
    assert.deepEqual(diagnostics.map(item => item.message), ['Translation key __proto__ is not allowed']);
    assert.equal(source.documentUser.getText(diagnostics[0].range), '"__proto__"');

    await source.triggerContentChange(TextDocument.create(uri, 'json', 3, '{"constructor":{"en":"Hidden","fr":"Caché"},"recovered":{"en":"Third","fr":"Troisième"}}'));
    assert.deepEqual(translation.keys, ['recovered']);
    assert.deepEqual(Object.keys(translation.parsed), ['recovered']);
    assert.deepEqual((await source.validate(false)).map(item => item.message), ['Translation key constructor is not allowed']);
    assert.equal(Object.hasOwn(translation.exported.en, 'constructor'), false);

    await source.triggerContentChange(TextDocument.create(uri, 'json', 4, '{"recovered":{"en":"Third","fr":"Troisième"}}'));
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.keys, ['recovered']);
    assert.deepEqual(translation.exported.en, { recovered: 'Third' });
});
