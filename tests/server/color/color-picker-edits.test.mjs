import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('color ranges use UTF-16 columns after CRLF and astral characters', () => {
    const text = '/* 😀 */\r\n.x { color: rgb(255 0 0 / 25%); background: #00ff0080; }';
    const document = TextDocument.create('file:///palette.wcs.avt', 'scss', 1, text);
    const found = ColorPicker.onDocumentColor(document);
    assert.deepEqual(found.map(item => document.getText(item.range)), ['rgb(255 0 0 / 25%)', '#00ff0080']);
    assert.deepEqual(found.map(item => item.range.start), [
        { line: 1, character: 12 }, { line: 1, character: 44 },
    ]);
    assert.equal(found[0].color.alpha, 0.25);
    assert.ok(Math.abs(found[1].color.alpha - 128 / 255) < 1e-6);
});

test('color discovery and alpha presentations follow an incremental document edit', () => {
    const document = TextDocument.create('file:///palette.wcs.avt', 'scss', 1,
        '.x { color: rgb(255 0 0 / 50%); background: blue; }');
    const initial = ColorPicker.onDocumentColor(document);
    assert.deepEqual(initial.map(item => document.getText(item.range)), ['rgb(255 0 0 / 50%)', 'blue']);
    assert.deepEqual(ColorPicker.onColorPresentations(document, initial[0].range, initial[0].color)
        .map(item => item.label), ['#ff000080', 'hsla(0, 100%, 50%, 0.5)', 'rgba(255, 0, 0, 0.5)']);

    TextDocument.update(document, [{ range: initial[0].range, text: 'hsl(120 100% 50%)' }], 2);
    const updated = ColorPicker.onDocumentColor(document);
    assert.deepEqual(updated.map(item => document.getText(item.range)), ['hsl(120 100% 50%)', 'blue']);
    assert.deepEqual(updated[0].color, { red: 0, green: 1, blue: 0, alpha: 1 });
    assert.deepEqual(ColorPicker.onColorPresentations(document, updated[0].range, updated[0].color)
        .map(item => item.label), ['#00ff00', 'hsl(120, 100%, 50%)', 'rgb(0, 255, 0)']);
});
