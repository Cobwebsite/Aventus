import assert from 'node:assert/strict';
import test from 'node:test';
import { color } from '@csstools/css-color-parser';
import { parseComponentValue } from '@csstools/css-parser-algorithms';
import { tokenize } from '@csstools/css-tokenizer';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('the valid transparent keyword disappears from document colors across edits', () => {
    const parsed = color(parseComponentValue(tokenize({ css: 'transparent' })));
    assert.notEqual(parsed, false);
    assert.equal(parsed.alpha, 0);

    const uri = 'file:///transparent-round138.wcs.avt';
    const document = TextDocument.create(uri, 'scss', 1, '.card { color: transparent; border-color: blue; }');
    const matchedText = () => ColorPicker.onDocumentColor(document)
        .map(item => document.getText(item.range));
    assert.deepEqual(matchedText(), ['blue']);

    const first = document.getText();
    TextDocument.update(document, [{ text: first.replace('transparent', 'rgba(0 0 0 / 0)') }], 2);
    assert.deepEqual(matchedText(), ['rgba(0 0 0 / 0)', 'blue']);

    const second = document.getText();
    TextDocument.update(document, [{ text: second.replace('rgba(0 0 0 / 0)', 'transparent') }], 3);
    assert.deepEqual(matchedText(), ['blue']);
});
