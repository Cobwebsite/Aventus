import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('CSS Color 4 notations and named colors expose stable ranges and bounded picker channels', () => {
    const source = [
        '/* color(display-p3 0 1 0) */',
        '.x { color: color(display-p3 1 0 0);',
        '     border: oklch(60% 0.2 50);',
        '     background: rebeccapurple; content: "oklch(60% 0.2 50)"; }',
    ].join('\n');
    const document = TextDocument.create('file:///wide-gamut.wcs.avt', 'scss', 1, source);
    const found = ColorPicker.onDocumentColor(document);

    assert.deepEqual(found.map(item => document.getText(item.range)), [
        'color(display-p3 1 0 0)', 'oklch(60% 0.2 50)', 'rebeccapurple',
    ]);
    assert.deepEqual(found.map(item => item.range.start.line), [1, 2, 3]);
    assert.deepEqual(found[2].color, { red: 0.4, green: 0.2, blue: 0.6, alpha: 1 });
    for (const { color } of found) {
        for (const value of Object.values(color)) {
            assert.ok(Number.isFinite(value) && value >= 0 && value <= 1);
        }
    }
});

test('wide gamut alpha and its presentations refresh after a document edit', () => {
    const uri = 'file:///wide-gamut-edit.wcs.avt';
    const initial = TextDocument.create(uri, 'scss', 1, '.x { color: color(display-p3 1 0 0 / 25%); }');
    const first = ColorPicker.onDocumentColor(initial);
    assert.equal(first.length, 1);
    assert.equal(first[0].color.alpha, 0.25);

    const updated = TextDocument.create(uri, 'scss', 2,
        '.x { border: 0; color: color(display-p3 0 1 0 / 75%); }');
    const second = ColorPicker.onDocumentColor(updated);
    assert.equal(second.length, 1);
    assert.equal(second[0].color.alpha, 0.75);
    assert.equal(updated.getText(second[0].range), 'color(display-p3 0 1 0 / 75%)');
    assert.notDeepEqual(second[0].range, first[0].range);
    const presentations = ColorPicker.onColorPresentations(updated, second[0].range, second[0].color);
    assert.equal(presentations.length, 3);
    assert.ok(presentations.every(item => item.label.includes('0.75') || item.label.endsWith('bf')));
});
