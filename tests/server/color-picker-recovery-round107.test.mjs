import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('a malformed functional color does not hide later valid colors', () => {
    const source = '.a { color: rgb(255, 0, 0; }\n.b { color: #0f0; border-color: BLUE; }';
    const document = TextDocument.create('file:///recovery.scss', 'scss', 1, source);
    const found = ColorPicker.onDocumentColor(document);

    assert.deepEqual(found.map(item => document.getText(item.range)), ['#0f0', 'BLUE']);
    assert.deepEqual(found.map(item => item.range.start.line), [1, 1]);
    assert.deepEqual(found.map(item => [item.color.red, item.color.green, item.color.blue]), [
        [0, 1, 0], [0, 0, 1],
    ]);
});

test('an edit repairs a malformed function without retaining its previous color matches', () => {
    const document = TextDocument.create('file:///repair.scss', 'scss', 1,
        '.a { color: RGB(255, 0, 0; background: #0f0; }');
    assert.deepEqual(ColorPicker.onDocumentColor(document).map(item => document.getText(item.range)), ['#0f0']);

    TextDocument.update(document, [{ text: '.a { color: RGB(255, 0, 0); background: #0f0; }' }], 2);
    const found = ColorPicker.onDocumentColor(document);
    assert.deepEqual(found.map(item => document.getText(item.range)), ['RGB(255, 0, 0)', '#0f0']);
    assert.deepEqual(found.map(item => [item.color.red, item.color.green, item.color.blue]), [
        [1, 0, 0], [0, 1, 0],
    ]);
});
