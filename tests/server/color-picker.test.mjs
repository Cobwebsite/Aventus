import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('color picker finds hex, RGB and named colors in a multiline document', () => {
    const document = TextDocument.create(
        'file:///style.wcs.avt', 'scss', 1,
        '/* palette */\n.a { color: #ff0000; background: blue; border-color: rgb(0, 255, 0); }'
    );
    const colors = ColorPicker.onDocumentColor(document);
    assert.equal(colors.length, 3);
    assert.deepEqual(colors.map(item => item.color).map(({ red, green, blue }) => [red, green, blue]), [
        [1, 0, 0], [0, 1, 0], [0, 0, 1],
    ]);
    assert.ok(colors.every(item => item.range.start.line === 1));
});

test('color picker presentations keep or omit alpha according to the source', () => {
    const rgbDocument = TextDocument.create('file:///style.wcs.avt', 'scss', 1, 'rgb(255, 0, 0)');
    const rgbRange = { start: { line: 0, character: 0 }, end: { line: 0, character: 14 } };
    const opaque = ColorPicker.onColorPresentations(rgbDocument, rgbRange, { red: 1, green: 0, blue: 0, alpha: 1 });
    assert.deepEqual(opaque.map(item => item.label), ['#ff0000', 'hsl(0, 100%, 50%)', 'rgb(255, 0, 0)']);

    const alphaDocument = TextDocument.create('file:///style.wcs.avt', 'scss', 1, 'rgba(255, 0, 0, 0.5)');
    const alphaRange = { start: { line: 0, character: 0 }, end: { line: 0, character: 20 } };
    const translucent = ColorPicker.onColorPresentations(alphaDocument, alphaRange, { red: 1, green: 0, blue: 0, alpha: 0.5 });
    assert.deepEqual(translucent.map(item => item.label), ['#ff000080', 'hsla(0, 100%, 50%, 0.5)', 'rgba(255, 0, 0, 0.5)']);
});
