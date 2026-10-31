import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown refreshes destructured function parameters across source revisions', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/destructured.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'destructured', file: { uri }, build,
        srcInfo: { available: [{ type: 4, fullName: 'describe' }] }, fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        assert.ok(file.fileParsed.functions.describe);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, '/** Object input. */ export function describe({label, count}: {label: string; count: number}): string { return label + count; }');
    assert.match(first, /Object input/);
    assert.match(first, /describe\(\{label, count\}: \{label: string; count: number\}\)/);
    assert.match(first, /Return : string/);

    const second = render(2, '/** Tuple input. */ export function describe([name, active]: [string, boolean]): boolean { return active; }');
    assert.match(second, /Tuple input/);
    assert.match(second, /describe\(\[name, active\]: \[string, boolean\]\)/);
    assert.match(second, /Return : boolean/);
    assert.doesNotMatch(second, /Object input|label|count|Return : string/);

    const third = render(3, '/** Rest input. */ export function describe(...values: number[]): number { return values.length; }');
    assert.match(third, /Rest input/);
    assert.match(third, /describe\(\.\.\.values: number\[\]\)/);
    assert.match(third, /Return : number/);
    assert.doesNotMatch(third, /Tuple input|\[name, active\]|Return : boolean/);
});
