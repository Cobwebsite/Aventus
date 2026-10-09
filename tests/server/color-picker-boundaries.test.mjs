import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('color picker ignores malformed colors and non-color names in a multiline document', () => {
    const document = TextDocument.create('file:///style.wcs.avt', 'scss', 1,
        '\n.redness { --red-tone: 1; content: "red"; color: madeup; background: rgb(nope); border: #gggggg; }');
    assert.deepEqual(ColorPicker.onDocumentColor(document), []);
});

test('color picker retains alpha in an 8-digit hex presentation', () => {
    const text = '#33669980';
    const document = TextDocument.create('file:///style.wcs.avt', 'scss', 1, text);
    const range = { start: { line: 0, character: 0 }, end: { line: 0, character: text.length } };
    const labels = ColorPicker.onColorPresentations(document, range,
        { red: 0.2, green: 0.4, blue: 0.6, alpha: 0.5 }).map(item => item.label);
    assert.equal(labels.length, 3);
    assert.equal(labels[0], '#33669980');
    assert.match(labels[1], /^hsla\(/);
    assert.match(labels[2], /^rgba\(/);
});
