import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { ColorPicker } = await loadServerModule('color-picker/ColorPicker.ts');

test('un color-mix imbriqué fournit une seule plage puis suit sa révision', () => {
    const uri = 'file:///D:/round252/nested.wcs.avt';
    const first = 'color-mix(in srgb, rgb(255 0 0) 25%, hsl(240 100% 50%))';
    const second = 'color-mix(in srgb, rgb(0 255 0) 75%, hsl(0 100% 50%))';
    const versions = [
        `.x { color: ${first}; border: #abc; }`,
        `.x { content: "${first}"; color: ${second}; border: #def; }`,
    ];
    for (let index = 0; index < versions.length; index++) {
        const document = TextDocument.create(uri, 'scss', index + 1, versions[index]);
        const colors = ColorPicker.onDocumentColor(document);
        assert.deepEqual(colors.map(item => document.getText(item.range)),
            index === 0 ? [first, '#abc'] : [second, '#def']);
        const expected = versions[index].indexOf(index === 0 ? first : second);
        assert.deepEqual(colors[0].range.start, document.positionAt(expected));
        assert.deepEqual(colors[0].range.end, document.positionAt(expected + (index === 0 ? first : second).length));
    }
});
