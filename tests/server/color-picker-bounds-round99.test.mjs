import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('document colors clamp alpha outside CSS bounds while retaining exact source ranges', () => {
    const source = '.x { a: rgb(255 0 0 / 200%); b: rgba(0, 0, 255, -0.1); c: rgb(0 255 0 / 50%); }';
    const document = TextDocument.create('file:///alpha.wcs.avt', 'scss', 1, source);
    const found = ColorPicker.onDocumentColor(document);

    assert.deepEqual(found.map(item => document.getText(item.range)), [
        'rgb(255 0 0 / 200%)', 'rgba(0, 0, 255, -0.1)', 'rgb(0 255 0 / 50%)',
    ]);
    assert.deepEqual(found.map(item => item.color.alpha), [1, 0, 0.5]);
    assert.deepEqual(found.map(item => [item.color.red, item.color.green, item.color.blue]), [
        [1, 0, 0], [0, 0, 1], [0, 1, 0],
    ]);
});

test('color positions account for CRLF and UTF-16 characters before a match', () => {
    const source = '/* 😀 #f00 */\r\n.x { content: "🟦 blue"; color: #00f; }';
    const document = TextDocument.create('file:///unicode.wcs.avt', 'scss', 1, source);
    const found = ColorPicker.onDocumentColor(document);

    assert.deepEqual(found.map(item => document.getText(item.range)), ['#00f']);
    assert.deepEqual(found[0].range, {
        start: { line: 1, character: source.split('\r\n')[1].indexOf('#00f') },
        end: { line: 1, character: source.split('\r\n')[1].indexOf('#00f') + 4 },
    });
});

test('SCSS line comments currently leak colors into document color information', () => {
    const source = '// #f00 blue\n.x { color: #00f; }';
    const document = TextDocument.create('file:///line-comment.scss', 'scss', 1, source);
    const found = ColorPicker.onDocumentColor(document);

    assert.deepEqual(found.map(item => document.getText(item.range)), ['#f00', '#00f', 'blue']);
    assert.deepEqual(found.map(item => item.range.start.line), [0, 1, 0]);
});
