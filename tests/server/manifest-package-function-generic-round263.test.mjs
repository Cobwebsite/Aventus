import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown refreshes generic function constraints and defaults across revisions', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/generic-function.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'generic-function', file: { uri }, build,
        srcInfo: { available: [{ type: 4, fullName: 'convert' }] }, fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        assert.ok(file.fileParsed.functions.convert);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, '/** String conversion. */ export function convert<T extends string = string>(value: T): T { return value; }');
    assert.match(first, /String conversion/);
    assert.match(first, /convert<T extends string = string>\(value: T\)/);
    assert.match(first, /Return : T/);

    const second = render(2, '/** Numeric conversion. */ export function convert<N extends number = number>(value: N): Promise<N> { throw 0; }');
    assert.match(second, /Numeric conversion/);
    assert.match(second, /convert<N extends number = number>\(value: N\)/);
    assert.match(second, /Return : Promise&lt;N&gt;/);
    assert.doesNotMatch(second, /String conversion|T extends string|value: T/);

    const third = render(3, '/** Direct conversion. */ export function convert(value: boolean): boolean { return value; }');
    assert.match(third, /Direct conversion/);
    assert.match(third, /convert\(value: boolean\)/);
    assert.match(third, /Return : boolean/);
    assert.doesNotMatch(third, /Numeric conversion|N extends number|Promise&lt;N&gt;/);
});
