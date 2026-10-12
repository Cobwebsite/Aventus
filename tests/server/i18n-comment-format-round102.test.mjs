import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../server/src/language-services/i18n/Parser.ts';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusI18nLanguageService } = await loadServerModule('language-services/i18n/LanguageService.ts');
const service = AventusI18nLanguageService.getInstance();
const uri = 'file:///D:/round102/messages.i18n.avt';

function fixture(version, source) {
    const documentUser = TextDocument.create(uri, 'json', version, source);
    return {
        file: { uri, documentUser, contentUser: source },
        build: { buildConfig: { i18n: { locales: ['en', 'fr'] } } },
        parsed: I18nParser.parse(documentUser),
    };
}

test('i18n comments validate but currently prevent formatting until removed', async () => {
    const commented = fixture(1, '{\n // translator note\n "z": {"en":"Z","fr":"Z"},\n "a": {"en":"A","fr":"A"}\n}');
    assert.deepEqual(await service.validate(commented), []);
    assert.deepEqual(await service.format(commented.file, null, {}), []);

    const cleaned = fixture(2, '{"z":{"en":"Z","fr":"Z"},"a":{"en":"A","fr":"A"}}');
    assert.deepEqual(await service.validate(cleaned), []);
    const edits = await service.format(cleaned.file, null, {});
    assert.equal(edits.length, 1);
    assert.deepEqual(Object.keys(JSON.parse(edits[0].newText)), ['a', 'z']);
    assert.deepEqual(edits[0].range, {
        start: { line: 0, character: 0 },
        end: cleaned.file.documentUser.positionAt(cleaned.file.contentUser.length),
    });
});
