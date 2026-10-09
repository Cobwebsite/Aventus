import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

function colors(source) {
    const document = TextDocument.create('file:///palette.wcs.avt', 'scss', 1, `\n${source}`);
    return ColorPicker.onDocumentColor(document);
}

test('color picker converts HSL and RGBA colors on a later line', () => {
    const found = colors('.x { color: hsl(120, 100%, 50%); background: rgba(255, 0, 0, 0.5); }');
    assert.equal(found.length, 2);
    assert.deepEqual(found.map(item => item.color), [
        { red: 0, green: 1, blue: 0, alpha: 1 },
        { red: 1, green: 0, blue: 0, alpha: 0.5 },
    ]);
    assert.ok(found.every(item => item.range.start.line === 1));
});

test('color picker finds HSLA values and the adjacent HSL color', () => {
    const found = colors('.x { color: hsla(120, 100%, 50%, 0.5); background: hsl(120, 100%, 50%); }');
    assert.equal(found.length, 2);
    assert.deepEqual(found.map(item => item.color), [
        { red: 0, green: 1, blue: 0, alpha: 0.5 },
        { red: 0, green: 1, blue: 0, alpha: 1 },
    ]);
});

test('color picker ignores colors inside CSS comments', () => {
    const source = '/* blue #ff0000 */ .x { color: green; }';
    const found = colors(source);
    assert.equal(found.length, 1);
    assert.equal(found[0].range.start.character, source.indexOf('green'));
});

test('color picker ignores strings and keeps positions after multiline comments', () => {
    const source = '.x { content: "blue \\"red\\""; /* #ff0000\n green */ color: hsla(120, 100%, 50%, 0.5); }';
    const document = TextDocument.create('file:///palette.wcs.avt', 'scss', 1, source);
    const found = ColorPicker.onDocumentColor(document);
    assert.equal(found.length, 1);
    assert.equal(document.getText(found[0].range), 'hsla(120, 100%, 50%, 0.5)');
});
