import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('uppercase opaque alpha functions retain explicit alpha presentations', () => {
    const document = TextDocument.create('file:///uppercase.scss', 'scss', 1,
        '.a { color: RGBA(255, 0, 0, 1); background: HSLA(120, 100%, 50%, 1); }');
    const found = ColorPicker.onDocumentColor(document);
    assert.deepEqual(found.map(item => document.getText(item.range)), [
        'RGBA(255, 0, 0, 1)', 'HSLA(120, 100%, 50%, 1)',
    ]);
    assert.deepEqual(found.map(item => item.color.alpha), [1, 1]);
    assert.deepEqual(found.map(item => ColorPicker.onColorPresentations(document, item.range, item.color)
        .map(presentation => presentation.label)), [
        ['#ff0000ff', 'hsla(0, 100%, 50%, 1)', 'rgba(255, 0, 0, 1)'],
        ['#00ff00ff', 'hsla(120, 100%, 50%, 1)', 'rgba(0, 255, 0, 1)'],
    ]);
});
