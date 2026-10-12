import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts',
    'language-services/i18n/File.ts',
]);

function fixture(t, content) {
    const uri = 'file:///D:/round64/duplicates.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, content));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });
    return {
        source,
        translation,
        change: (version, text) => source.triggerContentChange(TextDocument.create(uri, 'json', version, text)),
    };
}

test('une clé i18n répétée garde un diagnostic exact puis disparaît après édition', async t => {
    const initial = '{"greeting":{"en":"First","fr":"Premier"},"greeting":{"en":"Second","fr":"Deuxième"}}';
    const { source, translation, change } = fixture(t, initial);
    const errors = await source.validate(false);
    const duplicate = errors.find(item => /duplicate/i.test(item.message));
    assert.ok(duplicate, errors.map(item => item.message).join(', '));
    assert.equal(source.documentUser.getText(duplicate.range), '"greeting"');
    assert.deepEqual(translation.exported, {
        en: { greeting: 'Second' }, fr: { greeting: 'Deuxième' },
    });

    await change(2, '{"greeting":{"en":"First","fr":"Premier"}}');
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.exported, {
        en: { greeting: 'First' }, fr: { greeting: 'Premier' },
    });
    assert.deepEqual(translation.keys, ['greeting']);
});

test('une locale i18n répétée est corrigée sans laisser de diagnostic ou valeur ancienne', async t => {
    const { source, translation, change } = fixture(t,
        '{"greeting":{"en":"First","en":"Second","fr":"Bonjour"}}');
    const errors = await source.validate(false);
    const duplicate = errors.find(item => /duplicate/i.test(item.message));
    assert.ok(duplicate, errors.map(item => item.message).join(', '));
    assert.equal(source.documentUser.getText(duplicate.range), '"en"');
    assert.deepEqual(translation.exported, {
        en: { greeting: 'Second' }, fr: { greeting: 'Bonjour' },
    });

    await change(2, '{"greeting":{"en":"Corrected","fr":"Bonjour"}}');
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.exported, {
        en: { greeting: 'Corrected' }, fr: { greeting: 'Bonjour' },
    });
});
