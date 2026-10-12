import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('color information excludes incomplete expressions and masked positions around valid colors', () => {
    const source = [
        '/* #f00 */ .a { content: "blue"; color: #00f; }',
        '.b { color: rgba(255, 0, 0, 0); background: rgb(nope); }',
        '.c { color: hsl(120 100% 50%; background: #xyz; }',
    ].join('\n');
    const document = TextDocument.create('file:///positions.wcs.avt', 'scss', 1, source);
    const found = ColorPicker.onDocumentColor(document);

    assert.deepEqual(found.map(item => document.getText(item.range)), ['#00f', 'rgba(255, 0, 0, 0)']);
    assert.deepEqual(found.map(item => item.range.start), [
        { line: 0, character: source.split('\n')[0].indexOf('#00f') },
        { line: 1, character: source.split('\n')[1].indexOf('rgba') },
    ]);
    assert.deepEqual(found.map(item => item.color.alpha), [1, 0]);
});

test('presentations follow the supplied color for a valid selected range and an invalid range', () => {
    const document = TextDocument.create('file:///positions.wcs.avt', 'scss', 1,
        '.a { color: #f00; background: bogus; }');
    const [found] = ColorPicker.onDocumentColor(document);
    const invalidStart = document.getText().indexOf('bogus');
    const invalidRange = {
        start: document.positionAt(invalidStart),
        end: document.positionAt(invalidStart + 'bogus'.length),
    };

    assert.deepEqual(ColorPicker.onColorPresentations(document, found.range, found.color)
        .map(item => item.label), ['#ff0000', 'hsl(0, 100%, 50%)', 'rgb(255, 0, 0)']);
    assert.deepEqual(ColorPicker.onColorPresentations(document, invalidRange,
        { red: 0, green: 0, blue: 1, alpha: 0.25 }).map(item => item.label),
        ['#0000ff40', 'hsla(240, 100%, 50%, 0.25)', 'rgba(0, 0, 255, 0.25)']);
});
