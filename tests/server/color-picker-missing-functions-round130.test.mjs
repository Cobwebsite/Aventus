import assert from 'node:assert/strict';
import test from 'node:test';
import { color } from '@csstools/css-color-parser';
import { parseComponentValue } from '@csstools/css-parser-algorithms';
import { tokenize } from '@csstools/css-tokenizer';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('valid HWB, Lab, LCH and color-mix functions each produce one color range', () => {
    const functions = [
        'hwb(120 0% 0%)',
        'lab(50% 0 0)',
        'lch(50% 40 120)',
        'color-mix(in srgb, red 50%, blue)',
    ];
    for (const css of functions) {
        assert.notEqual(color(parseComponentValue(tokenize({ css }))), false, css);
    }

    const source = `.x { a: #f00; b: ${functions[0]}; c: ${functions[1]}; d: ${functions[2]}; e: ${functions[3]}; f: rgb(0 0 255); }`;
    const document = TextDocument.create('file:///missing-color-functions.wcs.avt', 'scss', 1, source);
    const found = ColorPicker.onDocumentColor(document);
    assert.deepEqual(found.map(item => document.getText(item.range)), ['#f00', ...functions, 'rgb(0 0 255)']);
});
