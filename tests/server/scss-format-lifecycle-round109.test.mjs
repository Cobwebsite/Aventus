import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
]);

function wrap(document) {
    return { documentUser: document };
}

test('SCSS format edits apply to the original CRLF document and remain stable on a second pass', async () => {
    const service = new AventusSCSSLanguageService({
        globalSCSSLanguageService: new AventusGlobalSCSSLanguageService(),
    });
    const uri = 'file:///D:/round109/layout.wcs.avt';
    const document = TextDocument.create(uri, 'scss', 1,
        '.a { z-index: 2; color: blue; }\r\n.b { width: 2px; height: 1px; }');
    const options = { tabSize: 4, insertSpaces: true };
    const edits = await service.format(wrap(document), null, options);
    assert.ok(edits.length > 0);
    const formatted = TextDocument.applyEdits(document, edits);
    assert.ok(formatted.indexOf('color: blue') < formatted.indexOf('z-index: 2'));
    assert.ok(formatted.indexOf('height: 1px') < formatted.indexOf('width: 2px'));

    const second = TextDocument.create(uri, 'scss', 2, formatted);
    const secondEdits = await service.format(wrap(second), null, options);
    assert.equal(TextDocument.applyEdits(second, secondEdits), formatted);
    assert.deepEqual(await service.doValidation(wrap(second)), []);
});
