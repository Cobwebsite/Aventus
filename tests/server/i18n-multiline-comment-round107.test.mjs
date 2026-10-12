import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { I18nParser } from '../../server/src/language-services/i18n/Parser.ts';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusI18nLanguageService } = await loadServerModule('language-services/i18n/LanguageService.ts');
const service = AventusI18nLanguageService.getInstance();
const uri = 'file:///D:/round107/messages.i18n.avt';

function fixture(version, content) {
    const documentUser = TextDocument.create(uri, 'json', version, content);
    return {
        file: { uri, documentUser, contentUser: content },
        parsed: I18nParser.parse(documentUser),
        build: { buildConfig: { i18n: { locales: ['en', 'fr'] } } },
    };
}

test('la validation i18n signale actuellement un faux échec JSON pour un commentaire de bloc multiligne', async () => {
    const commented = fixture(1, '{\n  /* note du traducteur\n     sur deux lignes */\n  "message": {"en":"Hello"}\n}');
    const errors = await service.validate(commented);
    assert.deepEqual(errors.map(error => error.message), ["Can't parse the json"]);

    const cleaned = fixture(2, '{\n  "message": {"en":"Hello"}\n}');
    const afterEdit = await service.validate(cleaned);
    assert.deepEqual(afterEdit.map(error => error.message), ['Missing locales fr']);
    assert.equal(cleaned.file.documentUser.getText(afterEdit[0].range), '"message"');
});
