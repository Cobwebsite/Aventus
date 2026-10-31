import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown renews variable declaration kind, type, value and documentation', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/settings.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'settings', file: { uri }, build,
        srcInfo: { available: [{ type: 5, fullName: 'LIMIT' }] }, fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        assert.ok(file.fileParsed.variables.LIMIT);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, '/** Fixed threshold. */ export const LIMIT: number = 12;');
    assert.match(first, /Fixed threshold/);
    assert.match(first, /Declaration : const/);
    assert.match(first, /Type : number/);
    assert.match(first, /Initial value : 12/);

    const second = render(2, '/** Mutable limit. */ export let LIMIT: string = "high";');
    assert.match(second, /Mutable limit/);
    assert.match(second, /Declaration : let/);
    assert.match(second, /Type : string/);
    assert.match(second, /Initial value : "high"/);
    assert.doesNotMatch(second, /Fixed threshold|Declaration : const|Type : number|Initial value : 12/);

    const third = render(3, '/** Legacy flag. */ export var LIMIT: boolean;');
    assert.match(third, /Legacy flag/);
    assert.match(third, /Declaration : var/);
    assert.match(third, /Type : boolean/);
    assert.doesNotMatch(third, /Initial value|Mutable limit|Declaration : let|Type : string|high/);
});
