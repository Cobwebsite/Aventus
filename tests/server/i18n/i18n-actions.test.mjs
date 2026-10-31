import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../../server/src/language-services/i18n/Parser.ts';
import { loadServerModule } from '../helpers/load-ts.mjs';
import { parseI18nAction } from '../helpers/i18n-edits.mjs';

const { AventusI18nLanguageService } = await loadServerModule('language-services/i18n/LanguageService.ts');
const service = AventusI18nLanguageService.getInstance();

function fixture(parsedSrc, locales = ['en', 'fr'], fallback = 'en') {
    const content = JSON.stringify(parsedSrc);
    const documentUser = TextDocument.create('file:///messages.i18n.avt', 'json', 1, content);
    return {
        file: { uri: documentUser.uri, documentUser, contentUser: content },
        parsedSrc,
        build: { buildConfig: { i18n: { locales, fallback } } },
    };
}

test('i18n code action fills each missing locale and preserves existing translations', async () => {
    const file = fixture({ z: { en: 'Hello' }, a: { fr: 'Salut' } });
    const actions = await service.codeAction(file, null);
    assert.equal(actions.length, 1);
    assert.equal(actions[0].title, 'Import missing locales');
    const edit = actions[0].edit.changes[file.file.uri][0];
    assert.equal(file.file.documentUser.offsetAt(edit.range.end), file.file.documentUser.offsetAt(edit.range.start));
    assert.deepEqual(parseI18nAction(file.file.documentUser, actions[0]), {
        a: { en: 'ⵌⵌ', fr: 'Salut' },
        z: { en: 'Hello', fr: 'ⵌⵌ' },
    });
});

test('i18n code action is absent when all locales are populated', async () => {
    assert.deepEqual(await service.codeAction(fixture({ hello: { en: 'Hello', fr: 'Bonjour' } }), null), []);
});

test('i18n formatter sorts both translation keys and locale names', async () => {
    const file = fixture({ z: { fr: 'Bonjour', en: 'Hello' }, a: { fr: 'Salut', en: 'Hi' } });
    const edits = await service.format(file.file, null, {});
    const sorted = JSON.parse(edits[0].newText);
    assert.deepEqual(Object.keys(sorted), ['a', 'z']);
    assert.deepEqual(Object.keys(sorted.a), ['en', 'fr']);
});

test('i18n missing-locale action fills every key and is stable after application', async () => {
    const initial = fixture({ b: { en: 'B' }, a: { fr: 'A' } });
    const action = (await service.codeAction(initial, null))[0];
    const filled = parseI18nAction(initial.file.documentUser, action);
    assert.deepEqual(Object.keys(filled), ['b', 'a']);
    assert.deepEqual(await service.codeAction(fixture(filled), null), []);
});

test('i18n action derives missing locales from the document when cached source is null', async () => {
    const broken = fixture({ key: { en: 'Hello' } });
    broken.parsedSrc = null;
    assert.deepEqual(parseI18nAction(broken.file.documentUser, (await service.codeAction(broken, null))[0]), {
        key: { en: 'Hello', fr: 'ⵌⵌ' },
    });
});

test('i18n validation catches duplicate translation keys', async () => {
    const content = '{"hello":{"en":"Hello"},"hello":{"en":"Again"}}';
    const documentUser = TextDocument.create('file:///messages.i18n.avt', 'json', 1, content);
    const diagnostics = await service.validate({
        file: { documentUser },
        parsed: I18nParser.parse(documentUser),
        build: { buildConfig: { i18n: { locales: ['en'] } } },
    });
    assert.ok(diagnostics.some(item => /duplicate/i.test(item.message)));
});

test('i18n validation catches duplicate locale entries under a key', async () => {
    const content = '{"hello":{"en":"Hello","en":"Again"}}';
    const documentUser = TextDocument.create('file:///messages.i18n.avt', 'json', 1, content);
    const diagnostics = await service.validate({
        file: { documentUser },
        parsed: I18nParser.parse(documentUser),
        build: { buildConfig: { i18n: { locales: ['en'] } } },
    });
    assert.ok(diagnostics.some(item => /duplicate/i.test(item.message)));
});
