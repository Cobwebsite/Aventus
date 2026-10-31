import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';
import { parseI18nAction } from '../helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts',
    'language-services/i18n/File.ts',
]);

function fixture(t, text) {
    const uri = 'file:///D:/round91/messages.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, text));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });
    return { source, translation, uri, change: (version, content) => source.triggerContentChange(TextDocument.create(uri, 'json', version, content)) };
}

test('les capacités i18n LSP suivent le document édité, avec les réponses actuellement disponibles', async t => {
    const { source, translation, change } = fixture(t, '{"old":{"en":"Old","fr":"Ancien"}}');
    const oldPosition = { line: 0, character: 3 };
    assert.deepEqual(await source.getCompletion(oldPosition), { isIncomplete: false, items: [] });
    assert.equal(await source.getHover(oldPosition), null);
    assert.equal(await source.getDefinition(oldPosition), null);
    assert.equal(translation.getKeyFromLocation([oldPosition, oldPosition]), 'old');

    await change(2, '{\n  "new": {"en":"New","fr":"Nouveau"}\n}');
    const newPosition = { line: 1, character: 4 };
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.keys, ['new']);
    assert.equal(translation.getKeyFromLocation([newPosition, newPosition]), 'new');
    assert.deepEqual(await source.getCompletion(newPosition), { isIncomplete: false, items: [] });
    assert.equal(await source.getHover(newPosition), null);
    assert.equal(await source.getDefinition(newPosition), null);
});

test('les diagnostics i18n et la correction proposée reflètent trois éditions successives', async t => {
    const { source, translation, uri, change } = fixture(t, '{"hello":{"en":"Hello"}}');
    let diagnostics = await source.validate(false);
    assert.deepEqual(diagnostics.map(item => [item.message, source.documentUser.getText(item.range)]), [
        ['Missing locales fr', '"hello"'],
    ]);
    let actions = await source.getCodeAction(diagnostics[0].range);
    assert.deepEqual(parseI18nAction(source.documentUser, actions[0]), { hello: { en: 'Hello', fr: 'ⵌⵌ' } });

    await change(2, '{\n  "hello": {"en":"Hello", "fr":"ⵌⵌ"}\n}');
    diagnostics = await source.validate(false);
    assert.deepEqual(diagnostics.map(item => [item.message, source.documentUser.getText(item.range)]), [
        ['Translation not set', '"ⵌⵌ"'],
    ]);
    assert.deepEqual(await source.getCodeAction(diagnostics[0].range), []);

    await change(3, '{\n  "hello": {"en":"Hello", "fr":"Bonjour"}\n}');
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(await source.getCodeAction({ start: { line: 1, character: 2 }, end: { line: 1, character: 9 } }), []);
    assert.deepEqual(translation.exported, { en: { hello: 'Hello' }, fr: { hello: 'Bonjour' } });
});
