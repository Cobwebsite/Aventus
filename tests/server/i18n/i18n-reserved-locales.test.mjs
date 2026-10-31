import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getLanguageService } from 'vscode-json-languageservice';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }, { AventusConfigSchema }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts', 'language-services/json/schema.ts',
]);

test('la configuration refuse les locales réservées', async () => {
    const service = getLanguageService({});
    const document = TextDocument.create('file:///round133/aventus.conf.avt', 'json', 1,
        '{"build":[{"src":"src","i18n":{"locales":["constructor","__proto__","en"],"fallback":"en"}}]}');
    const diagnostics = await service.doValidation(document, service.parseJSONDocument(document), undefined, AventusConfigSchema);
    assert.equal(diagnostics.filter(diagnostic => diagnostic.message === 'Matches a schema that is not allowed.').length, 2);
});

function fixture(t, locales, content) {
    const uri = 'file:///D:/round133/messages.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, content));
    const build = {
        buildConfig: { i18n: { locales, fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });
    return { uri, source, translation, change: (version, text) => source.triggerContentChange(TextDocument.create(uri, 'json', version, text)) };
}

test('une locale constructor configurée est ignorée et signalée si elle apparaît dans le JSON', async t => {
    const { source, translation, change } = fixture(t, ['en', 'constructor'], '{"message":{"en":"Hello"}}');
    assert.deepEqual(await source.validate(false), []);
    const actions = await source.getCodeAction({ start: { line: 0, character: 1 }, end: { line: 0, character: 10 } });
    assert.equal(actions.some(action => action.title === 'Import missing locales'), false);
    assert.equal(Object.hasOwn(translation.parsed.message.locales, 'constructor'), false);
    assert.deepEqual(translation.exported.en, { message: 'Hello' });
    assert.equal(Object.hasOwn(translation.exported, 'constructor'), false);

    await change(2, '{"message":{"en":"Hello","constructor":"Constructeur"}}');
    assert.deepEqual((await source.validate(false)).map(diagnostic => diagnostic.message), ['Locale constructor is not allowed']);
    assert.equal(Object.hasOwn(translation.parsed.message.locales, 'constructor'), false);
    assert.equal(Object.hasOwn(translation.exported, 'constructor'), false);
});

test('une locale __proto__ est signalée sans masquer les locales valides', async t => {
    const { source, translation, change } = fixture(t, ['en', '__proto__'], '{"message":{"en":"Hello","__proto__":"Prototype"}}');
    assert.equal(Object.hasOwn(translation.parsed.message.locales, '__proto__'), false);
    assert.equal(Object.hasOwn(translation.exported, '__proto__'), false);
    assert.deepEqual((await source.validate(false)).map(diagnostic => diagnostic.message), ['Locale __proto__ is not allowed']);

    await change(2, '{"message":{"en":"Hello","fr":"Bonjour"}}');
    assert.deepEqual((await source.validate(false)).map(diagnostic => diagnostic.message), ['Locale not needed']);
    assert.equal(translation.parsed.message.locales.fr.value, 'Bonjour');
});
