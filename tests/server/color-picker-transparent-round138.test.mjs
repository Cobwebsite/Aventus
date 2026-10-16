import assert from 'node:assert/strict';
import test from 'node:test';
import { color } from '@csstools/css-color-parser';
import { parseComponentValue } from '@csstools/css-parser-algorithms';
import { tokenize } from '@csstools/css-tokenizer';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('transparent keeps its alpha and range across edits', () => {
    const parsed = color(parseComponentValue(tokenize({ css: 'transparent' })));
    assert.notEqual(parsed, false);
    assert.equal(parsed.alpha, 0);

    const uri = 'file:///transparent-round138.wcs.avt';
    const document = TextDocument.create(uri, 'scss', 1, '.card { color: transparent; border-color: blue; }');
    const colors = () => ColorPicker.onDocumentColor(document);
    const matchedText = () => colors().map(item => document.getText(item.range));
    assert.deepEqual(matchedText(), ['transparent', 'blue']);
    assert.deepEqual(colors()[0].range, {
        start: { line: 0, character: 15 }, end: { line: 0, character: 26 },
    });
    assert.deepEqual(colors()[0].color, { red: 0, green: 0, blue: 0, alpha: 0 });
    assert.deepEqual(ColorPicker.onColorPresentations(document, colors()[0].range, colors()[0].color)
        .map(item => item.label), ['transparent', '#00000000', 'hsla(0, 0%, 0%, 0)', 'rgba(0, 0, 0, 0)']);

    const first = document.getText();
    TextDocument.update(document, [{ text: first.replace('transparent', 'rgba(0 0 0 / 0)') }], 2);
    assert.deepEqual(matchedText(), ['rgba(0 0 0 / 0)', 'blue']);
    assert.equal(colors()[0].color.alpha, 0);

    const second = document.getText();
    TextDocument.update(document, [{ text: second.replace('rgba(0 0 0 / 0)', 'transparent') }], 3);
    assert.deepEqual(matchedText(), ['transparent', 'blue']);
    assert.equal(colors()[0].color.alpha, 0);
});
