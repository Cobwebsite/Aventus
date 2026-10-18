import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown refreshes class method parameter shapes across revisions', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/method-parameters.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'method-parameters', file: { uri }, build,
        srcInfo: { available: [{ type: 1, fullName: 'Formatter' }] }, fileParsed: null,
    };
    const render = (version, method) => {
        const source = `export class Formatter {\n${method}\n}`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        assert.ok(file.fileParsed.classes.Formatter);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, '/** Label formatter. */\npublic format(label?: string): string { return label ?? ""; }');
    assert.match(first, /### Methods[\s\S]*\| format\(label\?: string\) \| string \| Label formatter\. \|/);

    const second = render(2, '/** Pair formatter. */\npublic format([label, count]: [string, number]): number { return count; }');
    assert.match(second, /### Methods[\s\S]*\| format\(\[label, count\]: \[string, number\]\) \| number \| Pair formatter\. \|/);
    assert.doesNotMatch(second, /Label formatter|label\?: string/);

    const third = render(3, '/** Batch formatter. */\npublic format(...values: boolean[]): boolean { return values[0]; }');
    assert.match(third, /### Methods[\s\S]*\| format\(\.\.\.values: boolean\[\]\) \| boolean \| Batch formatter\. \|/);
    assert.doesNotMatch(third, /Pair formatter|\[label, count\]|label\?: string/);
});
