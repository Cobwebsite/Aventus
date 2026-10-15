import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusI18nLanguageService } = await loadServerModule('language-services/i18n/LanguageService.ts');

test('le formatage i18n se rétablit après JSON invalide et utilise la dernière version du document', async () => {
    const service = AventusI18nLanguageService.getInstance();
    const uri = 'file:///D:/round164/format-edit.i18n.avt';
    const format = async (version, source) => {
        const documentUser = TextDocument.create(uri, 'json', version, source);
        const edits = await service.format({ documentUser, contentUser: source }, null, {});
        return edits.length ? TextDocument.applyEdits(documentUser, edits) : source;
    };
    const first = await format(1, '{"z":{"en":"Last"},"a":{"en":"First"}}');
    assert.deepEqual(Object.keys(JSON.parse(first)), ['a', 'z']);

    const malformed = await format(2, '{"z":{"en":');
    assert.equal(malformed, '{"z":{"en":');

    const repaired = await format(3, '{"middle":{"fr":"Milieu"},"first":{"fr":"Premier"}}');
    assert.deepEqual(Object.keys(JSON.parse(repaired)), ['first', 'middle']);
    assert.doesNotMatch(repaired, /"z"|"a"|"Last"/);
});
