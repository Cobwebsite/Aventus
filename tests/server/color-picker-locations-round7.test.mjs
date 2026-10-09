import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('color picker currently skips a named color at the beginning of a document', () => {
    const document = TextDocument.create('file:///palette.wcs.avt', 'scss', 1, 'red\nblue');
    const colors = ColorPicker.onDocumentColor(document);
    assert.equal(colors.length, 1);
    assert.deepEqual(colors[0].range.start, { line: 1, character: 0 });
    assert.deepEqual(colors[0].color, { red: 0, green: 0, blue: 1, alpha: 1 });
});

test('color picker currently throws for a color after column zero on the first line', () => {
    const document = TextDocument.create('file:///palette.wcs.avt', 'scss', 1, '.a { color: blue; }');
    assert.throws(() => ColorPicker.onDocumentColor(document), TypeError);
});
