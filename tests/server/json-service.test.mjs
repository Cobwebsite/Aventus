import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { AventusJSONLanguageService } = await loadServerModule('language-services/json/LanguageService.ts');
const service = AventusJSONLanguageService.getInstance();

function file(text, uri = 'file:///aventus.conf.avt') {
    return { documentUser: TextDocument.create(uri, 'json', 1, text) };
}

test('configuration service accepts a minimal project and rejects missing required fields', async () => {
    assert.deepEqual(await service.validate(file('{"module":"Demo","build":[{"src":[]}]}')), []);
    const missing = await service.validate(file('{"build":[{"src":[]}]}'));
    assert.ok(missing.some(diagnostic => diagnostic.message.includes('module')));
});

test('configuration service rejects unknown properties and malformed JSON', async () => {
    const unknown = await service.validate(file('{"module":"Demo","build":[],"unexpected":true}'));
    assert.ok(unknown.some(diagnostic => diagnostic.message.includes('unexpected')));
    const malformed = await service.validate(file('{"module":'));
    assert.ok(malformed.length > 0);
});

test('configuration service formats a document using the requested indentation', async () => {
    const current = file('{"module":"Demo","build":[{"src":[]}]}');
    const range = {
        start: { line: 0, character: 0 },
        end: current.documentUser.positionAt(current.documentUser.getText().length),
    };
    const edits = await service.format(current, range, { insertSpaces: true, tabSize: 2 });
    assert.ok(edits.length > 0);
    const formatted = TextDocument.applyEdits(current.documentUser, edits);
    assert.match(formatted, /\n  "module": "Demo"/);
});

test('configuration completion suggests project fields', async () => {
    const current = file('{"module":"Demo","build":[{"src":[]}],""}');
    const offset = current.documentUser.getText().lastIndexOf('""') + 1;
    const result = await service.doComplete(current, current.documentUser.positionAt(offset));
    assert.ok(result.items.some(item => item.label === 'dependencies'));
});

test('Sharp and PHP configuration schemas enforce their required output fields', async () => {
    const sharp = await service.validate(file('{}', 'file:///aventus.sharp.avt'));
    assert.ok(sharp.some(diagnostic => diagnostic.message.includes('csProj')));
    assert.ok(sharp.some(diagnostic => diagnostic.message.includes('outputPath')));
    const php = await service.validate(file('{}', 'file:///aventus.php.avt'));
    assert.ok(php.some(diagnostic => diagnostic.message.includes('output')));
});
