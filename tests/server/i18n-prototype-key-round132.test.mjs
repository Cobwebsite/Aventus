import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts',
    'language-services/i18n/File.ts',
]);

test('une clé i18n __proto__ après édition reste visible mais perd son analyse et son export', async t => {
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

    await source.triggerContentChange(TextDocument.create(uri, 'json', 2, '{"__proto__":{"en":"Second","fr":"Deuxième"}}'));
    assert.deepEqual(translation.keys, ['__proto__']);
    assert.deepEqual(Object.keys(translation.parsed), []);
    assert.equal(translation.getKeyFromLocation([{ line: 0, character: 3 }, { line: 0, character: 3 }]), null);
    assert.equal(Object.hasOwn(translation.exported.en, '__proto__'), false);
    assert.deepEqual((await source.validate(false)).map(item => item.message), ["Can't parse the json"]);

    await source.triggerContentChange(TextDocument.create(uri, 'json', 3, '{"recovered":{"en":"Third","fr":"Troisième"}}'));
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.keys, ['recovered']);
    assert.deepEqual(translation.exported.en, { recovered: 'Third' });
});
