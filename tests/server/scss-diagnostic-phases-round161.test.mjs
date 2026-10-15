import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusSCSSLanguageService }, { AventusGlobalSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/LanguageService.ts', 'language-services/scss/GlobalLanguageService.ts',
]);

test('les diagnostics SCSS passent d’une accolade absente à une valeur invalide puis disparaissent', async () => {
    const service = new AventusSCSSLanguageService({ globalSCSSLanguageService: new AventusGlobalSCSSLanguageService() });
    const uri = 'file:///D:/round161/diagnostic-phases.wcs.avt';
    const validate = (version, text) => service.doValidation({ documentUser: TextDocument.create(uri, 'scss', version, text) });

    const unclosed = await validate(1, '.card { color: red;');
    assert.ok(unclosed.some(item => item.severity === 1));

    const invalidValue = await validate(2, '\n.card { color: ; }');
    assert.ok(invalidValue.some(item => item.severity === 1 && item.range.start.line === 1));

    const fixed = await validate(3, '.card { color: blue; }');
    assert.deepEqual(fixed, []);

    const brokenAgain = await validate(4, '.card { color: green; }\n.other { width: ; }');
    assert.ok(brokenAgain.some(item => item.severity === 1 && item.range.start.line === 1));
    assert.ok(brokenAgain.every(item => item.range.start.line !== 0));
});
