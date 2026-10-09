import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const tools = await loadServerModule('tools.ts');
const { AventusErrorCode, AventusLanguageId } = await loadServerModule('definition.ts');

test('path and URI conversion encodes special characters and round-trips', () => {
    const path = 'D:\\Aventus\\a b@c.wcl.avt';
    const uri = tools.pathToUri(path);
    assert.equal(uri, 'file:///d%3A/Aventus/a%20b%40c.wcl.avt');
    assert.equal(tools.uriToPath(uri), 'd:/Aventus/a b@c.wcl.avt');
    assert.equal(tools.pathToUri(uri), uri);
});

test('language identification handles Aventus extensions and unknown files', () => {
    assert.equal(tools.getLanguageIdByUri('file:///component.wcv.avt'), AventusLanguageId.HTML);
    assert.equal(tools.getLanguageIdByUri('file:///component.wcs.avt'), AventusLanguageId.SCSS);
    assert.equal(tools.getLanguageIdByUri('file:///component.wcl.avt'), AventusLanguageId.TypeScript);
    assert.equal(tools.getLanguageIdByUri('file:///readme.md'), '');
});

test('diagnostic helpers preserve ranges, severity, codes and data', () => {
    const doc = TextDocument.create('file:///test.wcl.avt', 'typescript', 1, 'first\nsecond');
    const diagnostic = tools.createErrorTsPos(doc, 'problem', 6, 12, AventusErrorCode.MissingProp, { name: 'x' });
    assert.deepEqual(diagnostic.range, {
        start: { line: 1, character: 0 },
        end: { line: 1, character: 6 },
    });
    assert.equal(diagnostic.severity, 1);
    assert.equal(diagnostic.code, AventusErrorCode.MissingProp);
    assert.deepEqual(diagnostic.data, { name: 'x' });
    assert.equal(diagnostic.source, AventusLanguageId.TypeScript);
    assert.equal(tools.createWarningI18nPos(doc, 'warn', 0, 5).severity, 2);
});

test('range, word and nested-value helpers work on ordinary input', () => {
    const doc = TextDocument.create('file:///test.avt', 'typescript', 1, 'one\ntwo');
    assert.deepEqual(tools.convertRange(doc, { start: 4, length: 3 }), {
        start: { line: 1, character: 0 },
        end: { line: 1, character: 3 },
    });
    assert.deepEqual(tools.getWordAtText('const message = 1', 8), { start: 6, length: 7 });
    const object = {};
    tools.setValueToObject('foo.bar', object, 42);
    assert.deepEqual(object, { foo: { bar: 42 } });
    assert.equal(tools.md5('abc'), '900150983cd24fb0d6963f7d28e17f72');
});
