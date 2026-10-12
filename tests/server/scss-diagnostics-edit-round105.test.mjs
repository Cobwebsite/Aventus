import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/LanguageService.ts',
    'language-services/scss/GlobalLanguageService.ts',
]);

test('SCSS diagnostics track a later-line syntax error and clear after editing that document', async () => {
    const service = new AventusSCSSLanguageService({
        globalSCSSLanguageService: new AventusGlobalSCSSLanguageService(),
    });
    const uri = 'file:///D:/round105/panel.wcs.avt';
    const initial = TextDocument.create(uri, 'scss', 1,
        '.good { color: red; }\r\n.broken { color: ; }\r\n.final { width: 2px; }');
    const before = await service.doValidation({ documentUser: initial });
    assert.ok(before.some(item => item.range.start.line === 1 && item.severity === 1));
    assert.ok(before.every(item => item.range.start.line !== 0 && item.range.start.line !== 2));

    const repaired = TextDocument.create(uri, 'scss', 2,
        '.good { color: red; }\r\n.broken { color: blue; }\r\n.final { width: 2px; }');
    assert.deepEqual(await service.doValidation({ documentUser: repaired }), []);
});
