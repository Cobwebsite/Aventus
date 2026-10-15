import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusGlobalSCSSLanguageService }, { AventusSCSSLanguageService }] = await loadServerModules([
    'language-services/scss/GlobalLanguageService.ts',
    'language-services/scss/LanguageService.ts',
]);

const source = (uri, text, version = 1) => ({ documentUser: TextDocument.create(uri, 'scss', version, text) });

test('two global SCSS files provide a variable chain to two consumers through source edits and removal', async () => {
    const global = new AventusGlobalSCSSLanguageService();
    const local = new AventusSCSSLanguageService({ globalSCSSLanguageService: global });
    const baseUri = 'file:///D:/round227/base.scss.avt';
    const themeUri = 'file:///D:/round227/theme.scss.avt';
    const base = source(baseUri, ':root { --base: #123456; }');
    const theme = source(themeUri, ':root { --accent: var(--base); }');
    const consumers = ['card', 'badge'].map(name => {
        const file = source(`file:///D:/round227/${name}.wcs.avt`, `.${name} { color: var(--accent); background: var(--base); }`);
        const at = variable => file.documentUser.positionAt(file.documentUser.getText().indexOf(variable) + 3);
        return { file, at };
    });
    const load = (file, uri) => global.loadVariables({ file }, uri);
    const check = async (variable, uri, value) => {
        for (const { file, at } of consumers) {
            assert.equal((await local.findDefinition(file, at(variable)))?.[0]?.uri, uri);
            assert.equal((await local.doHover(file, at(variable)))?.contents?.value, `${variable}: ${value}`);
        }
    };

    load(base, baseUri);
    load(theme, themeUri);
    await check('--base', baseUri, '#123456');
    await check('--accent', themeUri, 'var(--base)');

    const revisedBase = source(baseUri, ':root { --base: #abcdef; --unused: 1px; }', 2);
    load(revisedBase, baseUri);
    await check('--base', baseUri, '#abcdef');
    await check('--accent', themeUri, 'var(--base)');

    global.removeVariables(baseUri);
    for (const { file, at } of consumers) {
        assert.equal(await local.findDefinition(file, at('--base')), null);
        assert.notEqual((await local.doHover(file, at('--base')))?.contents?.value, '--base: #abcdef');
    }
    await check('--accent', themeUri, 'var(--base)');

    const revisedTheme = source(themeUri, ':root { --accent: #fedcba; }', 2);
    load(revisedTheme, themeUri);
    await check('--accent', themeUri, '#fedcba');
    global.removeVariables(themeUri);
    for (const { file, at } of consumers) {
        assert.equal(await local.findDefinition(file, at('--accent')), null);
    }
});
