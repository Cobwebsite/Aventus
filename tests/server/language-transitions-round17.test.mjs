import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../server/src/language-services/i18n/Parser.ts';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }, { AventusI18nLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/i18n/LanguageService.ts',
]);

test('reloading a global SCSS document replaces removed declarations without disturbing another file', () => {
    const service = new AventusGlobalSCSSLanguageService();
    const first = 'file:///first.scss.avt';
    const second = 'file:///second.scss.avt';
    const load = (uri, content, version) => service.loadVariables({
        file: { documentUser: TextDocument.create(uri, 'scss', version, content) },
    }, uri);

    load(first, ':root { --old: red; --shared: green; }', 1);
    load(second, ':root { --shared: blue; --other: white; }', 1);
    assert.equal(service.getDefinition('--shared').value, 'green');

    load(first, ':root { --new: black; }', 2);
    assert.equal(service.getDefinition('--old'), undefined);
    assert.equal(service.getDefinition('--new').value, 'black');
    assert.equal(service.getDefinition('--shared').uri, second);
    assert.equal(service.getDefinition('--other').value, 'white');
});

test('i18n validation recalculates diagnostics after an invalid document becomes valid', async () => {
    const service = AventusI18nLanguageService.getInstance();
    const uri = 'file:///transition.i18n.avt';
    const fixture = (content, version) => {
        const documentUser = TextDocument.create(uri, 'json', version, content);
        return {
            file: { uri, documentUser, contentUser: content },
            build: { buildConfig: { i18n: { locales: ['en', 'fr'] } } },
            parsed: I18nParser.parse(documentUser),
        };
    };

    const malformed = await service.validate(fixture('{"first":{"en":', 1));
    assert.ok(malformed.length > 0);
    const partial = await service.validate(fixture('{"first":{"en":"Hello"}}', 2));
    assert.deepEqual(partial.map(error => error.message), ['Missing locales fr']);
    const complete = await service.validate(fixture('{"first":{"en":"Hello","fr":"Salut"}}', 3));
    assert.deepEqual(complete, []);
});

test('i18n diagnostics identify each incomplete translation independently across multiple keys', async () => {
    const service = AventusI18nLanguageService.getInstance();
    const content = '{\n  "alpha": {"en":"A"},\n  "beta": {"fr":"B"}\n}';
    const documentUser = TextDocument.create('file:///multikey.i18n.avt', 'json', 1, content);
    const diagnostics = await service.validate({
        file: { uri: documentUser.uri, documentUser, contentUser: content },
        build: { buildConfig: { i18n: { locales: ['en', 'fr'] } } },
        parsed: I18nParser.parse(documentUser),
    });
    assert.deepEqual(diagnostics.map(error => [
        error.message,
        documentUser.getText(error.range),
    ]), [
        ['Missing locales fr', '"alpha"'],
        ['Missing locales en', '"beta"'],
    ]);
});
