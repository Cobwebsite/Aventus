import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown renews inferred and explicit function and method signatures', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/inferred-signatures.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'inferred-signatures', file: { uri }, build,
        srcInfo: { available: [{ type: 4, fullName: 'convert' }, { type: 1, fullName: 'Formatter' }] },
        fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse(
            { uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build,
        );
        assert.ok(file.fileParsed.functions.convert);
        assert.ok(file.fileParsed.classes.Formatter);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, `
        /** Initial conversion. */ export function convert(value = 1) { return value; }
        export class Formatter {
            /** Initial method. */
            public apply(input = true) { return input; }
        }
    `);
    assert.match(first, /convert\(value: number = 1\)/);
    assert.match(first, /Return : number/);
    assert.match(first, /\| apply\(input: boolean = true\) \| boolean \| Initial method\. \|/);

    const second = render(2, `
        /** Explicit conversion. */ export function convert(value: string): string { return value; }
        export class Formatter {
            /** Explicit method. */
            public apply(input: number): number { return input; }
        }
    `);
    assert.match(second, /convert\(value: string\)/);
    assert.match(second, /Return : string/);
    assert.match(second, /\| apply\(input: number\) \| number \| Explicit method\. \|/);
    assert.doesNotMatch(second, /Initial conversion|Initial method|value: number|input: boolean/);

    const third = render(3, `
        /** Final conversion. */ export function convert(value = false) { return value; }
        export class Formatter {
            /** Final method. */
            public apply(input = 'x') { return input; }
        }
    `);
    assert.match(third, /Final conversion/);
    assert.match(third, /convert\(value: boolean = false\)/);
    assert.match(third, /Return : boolean/);
    assert.match(third, /\| apply\(input: string = 'x'\) \| string \| Final method\. \|/);
    assert.doesNotMatch(third, /Explicit conversion|Explicit method|value: string|input: number/);
});
