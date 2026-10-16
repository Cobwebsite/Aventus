import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';
import { parseI18nAction } from './helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

function fixture(t, locales, content) {
    const uri = 'file:///D:/round133/messages.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, content));
    const build = {
        buildConfig: { i18n: { locales, fallback: 'en' } },
        tsFiles: {}, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });
    return { uri, source, translation, change: (version, text) => source.triggerContentChange(TextDocument.create(uri, 'json', version, text)) };
}

test('une locale constructor manquante est masquée par la propriété héritée puis apparaît après édition', async t => {
    const { source, translation, change } = fixture(t, ['en', 'constructor'], '{"message":{"en":"Hello"}}');
    assert.deepEqual(await source.validate(false), []);
    const action = (await source.getCodeAction({ start: { line: 0, character: 1 }, end: { line: 0, character: 10 } }))[0];
    assert.deepEqual(parseI18nAction(source.documentUser, action), {
        message: { constructor: 'ⵌⵌ', en: 'Hello' },
    });
    assert.equal(Object.hasOwn(translation.parsed.message.locales, 'constructor'), false);
    assert.deepEqual(translation.exported.en, { message: 'Hello' });
    assert.deepEqual(translation.exported.constructor, {});

    await change(2, '{"message":{"en":"Hello","constructor":"Constructeur"}}');
    assert.deepEqual(await source.validate(false), []);
    assert.equal(translation.parsed.message.locales.constructor.value, 'Constructeur');
    assert.deepEqual(translation.exported.constructor, { message: 'Constructeur' });
});

test('une locale __proto__ présente dans le JSON disparaît de l analyse puis le diagnostic change après édition', async t => {
    const { source, translation, change } = fixture(t, ['en', '__proto__'], '{"message":{"en":"Hello","__proto__":"Prototype"}}');
    assert.equal(Object.hasOwn(translation.parsed.message.locales, '__proto__'), false);
    assert.equal(Object.hasOwn(translation.exported, '__proto__'), false);
    assert.deepEqual((await source.validate(false)).map(diagnostic => diagnostic.message), ["Can't parse the json"]);

    await change(2, '{"message":{"en":"Hello","fr":"Bonjour"}}');
    assert.deepEqual((await source.validate(false)).map(diagnostic => diagnostic.message), ['Locale not needed']);
    assert.equal(translation.parsed.message.locales.fr.value, 'Bonjour');
});
