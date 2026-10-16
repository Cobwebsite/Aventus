import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('document colors follow their positions across named, hex and functional colors', () => {
    const source = '.a { color: blue; background: #f00; border-color: rgb(0 255 0); outline-color: red; }';
    const document = TextDocument.create('file:///ordered.wcs.avt', 'scss', 1, source);

    const found = ColorPicker.onDocumentColor(document);

    assert.deepEqual(found.map(item => document.getText(item.range)), [
        'blue', '#f00', 'rgb(0 255 0)', 'red',
    ]);
    assert.deepEqual(found.map(item => item.range.start.character), [
        source.indexOf('blue'), source.indexOf('#f00'), source.indexOf('rgb('), source.indexOf('red'),
    ]);
});

test('a named color inside a recognized functional color is not reported twice', () => {
    const source = '.a { color: color(from red srgb r g b); background: blue; }';
    const document = TextDocument.create('file:///overlap.wcs.avt', 'scss', 1, source);
    const found = ColorPicker.onDocumentColor(document);
    assert.deepEqual(found.map(item => document.getText(item.range)), [
        'color(from red srgb r g b)', 'blue',
    ]);
});
