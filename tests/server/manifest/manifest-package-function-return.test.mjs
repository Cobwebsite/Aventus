import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown refreshes a parsed function return type through composite revisions', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/return-types.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'return-types', file: { uri }, build,
        srcInfo: { available: [{ type: 4, fullName: 'resolveValue' }] }, fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, '/** Fetch the original shape. */ export function resolveValue(key: string): Promise<string | null> { throw 0; }');
    assert.match(first, /Fetch the original shape/);
    assert.match(first, /resolveValue\(key: string\)/);
    assert.match(first, /Return : Promise&lt;string &vert; null&gt;/);

    const second = render(2, '/** Fetch the revised shape. */ export function resolveValue(id: number): Record<string, number[]> { throw 0; }');
    assert.match(second, /Fetch the revised shape/);
    assert.match(second, /resolveValue\(id: number\)/);
    assert.match(second, /Return : Record&lt;string, number\[\]&gt;/);
    assert.doesNotMatch(second, /original shape|key: string|Promise&lt;string/);

    const third = render(3, '/** Return a simple result. */ export function resolveValue(): boolean { return true; }');
    assert.match(third, /Return a simple result/);
    assert.match(third, /resolveValue\(\)/);
    assert.match(third, /Return : boolean/);
    assert.doesNotMatch(third, /revised shape|id: number|Record&lt;|Promise&lt;/);
});
