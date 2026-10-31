import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }, { GenericServer }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts', 'GenericServer.ts',
]);

test('i18n hides locale correction while the current JSON is invalid', async t => {
    const uri = 'file:///D:/round125/messages.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        '{"message":{"en":"Old"}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    const previousServer = GenericServer.instance;
    const errors = [];
    GenericServer.instance = { logLevel: 0, connection: { showErrorMessage: message => errors.push(message) } };
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
        GenericServer.instance = previousServer;
    });

    const range = { start: { line: 0, character: 1 }, end: { line: 0, character: 10 } };
    const initialActions = await source.getCodeAction(range);
    assert.equal(initialActions.length, 1);
    assert.equal(initialActions[0].title, 'Import missing locales');

    const invalid = '{"message":{"en":"Editing","fr":';
    await source.triggerContentChange(TextDocument.create(uri, 'json', 2, invalid));
    assert.ok((await source.validate(false)).length > 0);
    assert.deepEqual(translation.keys, ['message']);

    assert.deepEqual(await source.getCodeAction(range), []);
    assert.deepEqual(errors, ['The i18n file is malformed. Fix its JSON before importing missing locales.']);

    await source.triggerContentChange(TextDocument.create(uri, 'json', 3,
        '{"message":{"en":"Updated","fr":"Mis à jour"}}'));
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(await source.getCodeAction(range), []);
});
