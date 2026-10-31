import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown refreshes parsed interface generic constraints, heritage and members across revisions', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/contracts.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'contracts', file: { uri }, build,
        srcInfo: { available: [{ type: 3, fullName: 'Contract' }] },
        fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, `interface Named { name: string; }
        /** Original contract. */ export interface Contract<T extends string = string> extends Named {
            /** Old payload. */ payload: T;
            /** Old conversion. */ convert(input: T): string;
        }`);
    assert.match(first, /## Contract<T extends string = string>/);
    assert.match(first, /Original contract/);
    assert.match(first, /payload/);
    assert.match(first, /convert\(input: T\)/);

    const second = render(2, `interface Identified { id: number; }
        /** Revised contract. */ export interface Contract<U extends number = number> extends Identified {
            /** New code. */ code: U;
            /** New mapping. */ map(value: U): boolean;
        }`);
    assert.match(second, /## Contract<U extends number = number>/);
    assert.match(second, /Revised contract/);
    assert.match(second, /code/);
    assert.match(second, /map\(value: U\)/);
    assert.doesNotMatch(second, /Original contract|Old payload|Old conversion|payload|convert\(|Named|Contract<T/);

    const third = render(3, `/** Final contract. */ export interface Contract { enabled: boolean; }`);
    assert.match(third, /## Contract\b/);
    assert.match(third, /Final contract/);
    assert.match(third, /enabled/);
    assert.doesNotMatch(third, /Contract<|Revised contract|code|map\(|Identified/);
});
