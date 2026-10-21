import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from './helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('a nested unquoted URL masks named colors until its matching closing parenthesis', () => {
    const uri = 'file:///nested-url.wcs.avt';
    const versions = [
        '.x { background: url(data:image/svg+xml,(red)blue); color: green; }',
        '.x { background: url(data:image/svg+xml,(red)); color: blue; }',
    ];
    const expected = [
        ['green'],
        ['blue'],
    ];

    for (let index = 0; index < versions.length; index++) {
        const document = TextDocument.create(uri, 'scss', index + 1, versions[index]);
        const found = ColorPicker.onDocumentColor(document);
        assert.deepEqual(found.map(item => document.getText(item.range)), expected[index]);
        for (const item of found) {
            const token = document.getText(item.range);
            assert.deepEqual(item.range.start, document.positionAt(versions[index].indexOf(token)));
        }
    }
});
