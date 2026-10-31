import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('color picker ignores an unquoted URL fragment while preserving an adjacent color', () => {
    const source = '.icon { mask-image: url(icon.svg#f00); color: #00f; }';
    const document = TextDocument.create('file:///fragment.scss', 'scss', 1, source);
    const found = ColorPicker.onDocumentColor(document);
    assert.deepEqual(found.map(item => document.getText(item.range)), ['#00f']);
    assert.deepEqual(found.map(item => [item.color.red, item.color.green, item.color.blue]), [
        [0, 0, 1],
    ]);
    assert.equal(found[0].range.start.character, source.indexOf('#00f'));
});

test('quoting the same URL masks its fragment while preserving the adjacent CSS color', () => {
    const source = '.icon { mask-image: url("icon.svg#f00"); color: #00f; }';
    const document = TextDocument.create('file:///quoted-fragment.scss', 'scss', 1, source);
    const found = ColorPicker.onDocumentColor(document);
    assert.deepEqual(found.map(item => document.getText(item.range)), ['#00f']);
    assert.equal(found[0].range.start.character, source.indexOf('#00f'));
});
