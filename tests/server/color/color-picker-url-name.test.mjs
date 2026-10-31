import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('color picker ignores a named color inside an unquoted CSS URL', () => {
    const source = '.icon { background-image: url(red); color: blue; }';
    const document = TextDocument.create('file:///url-name.wcs.avt', 'scss', 1, source);

    const found = ColorPicker.onDocumentColor(document);

    assert.deepEqual(found.map(item => document.getText(item.range)), ['blue']);
    assert.deepEqual(found.map(item => item.range.start.character), [
        source.indexOf('blue'),
    ]);
});

test('quoting the same URL hides its named color while keeping the CSS declaration', () => {
    const source = '.icon { background-image: url("red"); color: blue; }';
    const document = TextDocument.create('file:///quoted-url-name.wcs.avt', 'scss', 1, source);

    assert.deepEqual(ColorPicker.onDocumentColor(document).map(item => document.getText(item.range)), ['blue']);
});
