import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('la correction des locales manquantes reste proposée hors de la plage diagnostiquée et suit les éditions', async t => {
    const uri = 'file:///D:/round225/messages.i18n.avt';
    const makeDocument = (version, text) => TextDocument.create(uri, 'json', version, text);
    const source = new InternalAventusFile(makeDocument(1,
        '{"alpha":{"en":"One"},"beta":{"en":"Two","fr":"Deux"}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });

    const diagnostics = await source.validate(false);
    assert.deepEqual(diagnostics.map(item => [item.message, source.documentUser.getText(item.range)]), [
        ['Missing locales fr', '"alpha"'],
    ]);
    const unrelated = source.documentUser.positionAt(source.contentUser.indexOf('"beta"') + 2);
    const range = { start: unrelated, end: unrelated };
    const actions = await source.getCodeAction(range);
    assert.equal(actions.length, 1);
    const edit = actions[0].edit.changes[uri];
    assert.deepEqual(JSON.parse(TextDocument.applyEdits(source.documentUser, edit)), {
        alpha: { en: 'One', fr: 'ⵌⵌ' }, beta: { en: 'Two', fr: 'Deux' },
    });

    await source.triggerContentChange(makeDocument(2,
        '{"alpha":{"en":"One","fr":"Un"},"beta":{"en":"Two"}}'));
    assert.deepEqual((await source.validate(false)).map(item => [item.message, source.documentUser.getText(item.range)]), [
        ['Missing locales fr', '"beta"'],
    ]);
    const nextActions = await source.getCodeAction({ start: { line: 0, character: 0 }, end: { line: 0, character: 0 } });
    assert.equal(nextActions.length, 1);
    assert.deepEqual(JSON.parse(TextDocument.applyEdits(source.documentUser, nextActions[0].edit.changes[uri])), {
        alpha: { en: 'One', fr: 'Un' }, beta: { en: 'Two', fr: 'ⵌⵌ' },
    });
    assert.deepEqual(translation.exported, { en: { alpha: 'One', beta: 'Two' }, fr: { alpha: 'Un' } });
});
