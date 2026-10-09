import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('color picker locates named colors from the beginning of a document', () => {
    const document = TextDocument.create('file:///palette.wcs.avt', 'scss', 1, 'red\nblue');
    const colors = ColorPicker.onDocumentColor(document);
    assert.equal(colors.length, 2);
    assert.deepEqual(colors[0].range, { start: { line: 0, character: 0 }, end: { line: 0, character: 3 } });
    assert.deepEqual(colors[1].range, { start: { line: 1, character: 0 }, end: { line: 1, character: 4 } });
    assert.deepEqual(colors[1].color, { red: 0, green: 0, blue: 1, alpha: 1 });
});

test('color picker locates a color after column zero on the first line', () => {
    const document = TextDocument.create('file:///palette.wcs.avt', 'scss', 1, '.a { color: blue; }');
    const colors = ColorPicker.onDocumentColor(document);
    assert.equal(colors.length, 1);
    assert.deepEqual(colors[0].range, { start: { line: 0, character: 12 }, end: { line: 0, character: 16 } });
});

test('color picker locates a hex color at index zero without a newline', () => {
    const document = TextDocument.create('file:///palette.wcs.avt', 'scss', 1, '#ff0000');
    const colors = ColorPicker.onDocumentColor(document);
    assert.equal(colors.length, 1);
    assert.deepEqual(colors[0].range, { start: { line: 0, character: 0 }, end: { line: 0, character: 7 } });
});
