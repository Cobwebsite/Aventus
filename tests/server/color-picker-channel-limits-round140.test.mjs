import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('out-of-range CSS RGB channels are clamped independently', () => {
    const source = '.x { a: rgb(300 -10 20 / 25%); b: rgb(-20 280 0 / 125%); c: rgb(nope); }';
    const document = TextDocument.create('file:///channel-limits.wcs.avt', 'scss', 1, source);
    const found = ColorPicker.onDocumentColor(document);

    assert.deepEqual(found.map(item => document.getText(item.range)), [
        'rgb(300 -10 20 / 25%)', 'rgb(-20 280 0 / 125%)',
    ]);
    assert.deepEqual(found.map(item => item.color), [
        { red: 1, green: 0, blue: 20 / 255, alpha: 0.25 },
        { red: 0, green: 1, blue: 0, alpha: 1 },
    ]);
});
