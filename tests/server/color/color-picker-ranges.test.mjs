import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

const labels = (document, range, color) =>
    ColorPicker.onColorPresentations(document, range, color).map(item => item.label);

test('presentations use the selected color when two colors share a line', () => {
    const document = TextDocument.create('file:///colors.wcs.avt', 'scss', 1,
        '.x { color: #f00; background: rgba(0, 0, 255, 0.25); }');
    const colors = ColorPicker.onDocumentColor(document);
    assert.deepEqual(colors.map(item => document.getText(item.range)), ['#f00', 'rgba(0, 0, 255, 0.25)']);
    assert.deepEqual(labels(document, colors[0].range, colors[0].color),
        ['#ff0000', 'hsl(0, 100%, 50%)', 'rgb(255, 0, 0)']);
    assert.deepEqual(labels(document, colors[1].range, colors[1].color),
        ['#0000ff40', 'hsla(240, 100%, 50%, 0.25)', 'rgba(0, 0, 255, 0.25)']);
});

test('color information and presentations refresh when an edit removes a color', () => {
    const document = TextDocument.create('file:///colors.wcs.avt', 'scss', 1,
        '.x { color: #ff0000; background: blue; }');
    const original = ColorPicker.onDocumentColor(document);
    assert.equal(original.length, 2);
    TextDocument.update(document, [{ range: original[0].range, text: 'inherit' }], 2);
    const updated = ColorPicker.onDocumentColor(document);
    assert.deepEqual(updated.map(item => document.getText(item.range)), ['blue']);
    assert.deepEqual(updated[0].range.start, { line: 0, character: 33 });
    assert.deepEqual(labels(document, updated[0].range, updated[0].color),
        ['#0000ff', 'hsl(240, 100%, 50%)', 'rgb(0, 0, 255)']);
});

test('an empty range produces presentations from the supplied color', () => {
    const document = TextDocument.create('file:///colors.wcs.avt', 'scss', 1, 'not a color');
    const range = { start: { line: 0, character: 4 }, end: { line: 0, character: 4 } };
    assert.deepEqual(ColorPicker.onDocumentColor(document), []);
    assert.deepEqual(labels(document, range, { red: 1, green: 0, blue: 0, alpha: 1 }),
        ['#ff0000', 'hsl(0, 100%, 50%)', 'rgb(255, 0, 0)']);
});

test('opaque four-digit hex keeps its explicit alpha syntax in presentations', () => {
    const document = TextDocument.create('file:///colors.wcs.avt', 'scss', 1, '#f00f');
    const [found] = ColorPicker.onDocumentColor(document);
    assert.deepEqual(found.color, { red: 1, green: 0, blue: 0, alpha: 1 });
    assert.deepEqual(labels(document, found.range, found.color),
        ['#ff0000ff', 'hsla(0, 100%, 50%, 1)', 'rgba(255, 0, 0, 1)']);
});
