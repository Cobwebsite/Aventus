import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('les couleurs de repli CSS var suivent leurs révisions sans prendre le nom de variable', () => {
    const uri = 'file:///D:/round259/fallback.wcs.avt';
    const versions = [
        { source: '.x { color: var(--red, #f00); border: blue; }', expected: ['#f00', 'blue'] },
        { source: '.x { color: var(--blue, rgb(0 255 0)); border: #abc; }', expected: ['rgb(0 255 0)', '#abc'] },
        { source: '.x { color: var(--blue); border: #def; }', expected: ['#def'] },
    ];
    versions.forEach(({ source, expected }, index) => {
        const document = TextDocument.create(uri, 'scss', index + 1, source);
        const colors = ColorPicker.onDocumentColor(document);
        assert.deepEqual(colors.map(item => document.getText(item.range)), expected);
        assert.deepEqual(colors.map(item => item.range.start.character),
            expected.map(value => source.indexOf(value)));
    });
});
