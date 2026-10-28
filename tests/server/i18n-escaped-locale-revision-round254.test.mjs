import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';
import { applyI18nAction } from './helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('une locale JSON échappée reste reconnue après ajout puis renommage de clé', async t => {
    const uri = 'file:///D:/round254/escaped-locale.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        '{"title":{"\\u0065n":"Hello"}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });
    const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
    const messages = async () => (await source.validate(false)).map(diagnostic => diagnostic.message);
    const edit = (version, content) => source.triggerContentChange(
        TextDocument.create(uri, 'json', version, content));

    assert.deepEqual(await messages(), ['Missing locales fr']);
    assert.deepEqual(translation.exported, { en: { title: 'Hello' }, fr: {} });
    const [action] = await source.getCodeAction(range);
    assert.equal(action.title, 'Import missing locales');
    const completed = applyI18nAction(source.documentUser, action);
    assert.deepEqual(JSON.parse(completed), { title: { en: 'Hello', fr: 'ⵌⵌ' } });
    assert.match(completed, /"\\u0065n"/);

    await edit(2, completed.replace('ⵌⵌ', 'Bonjour'));
    assert.deepEqual(await messages(), []);
    assert.deepEqual(translation.exported, {
        en: { title: 'Hello' }, fr: { title: 'Bonjour' },
    });

    await edit(3, '{"heading":{"en":"Hi","fr":"Salut"}}');
    assert.deepEqual(await messages(), []);
    assert.deepEqual(await source.getCodeAction(range), []);
    assert.deepEqual(translation.keys, ['heading']);
    assert.deepEqual(translation.exported, {
        en: { heading: 'Hi' }, fr: { heading: 'Salut' },
    });
});
