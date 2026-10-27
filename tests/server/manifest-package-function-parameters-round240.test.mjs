import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown refreshes parsed optional, default and rest parameters after edits', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/function-parameters.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'function-parameters', file: { uri }, build,
        srcInfo: { available: [{ type: 4, fullName: 'combine' }] }, fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, '/** Original combination. */ export function combine(first?: string, suffix = "!", ...parts: number[]): string { return ""; }');
    assert.match(first, /Original combination/);
    assert.match(first, /combine\(first\?: string, suffix: string = "!", \.\.\.parts: number\[\]\)/);

    const second = render(2, '/** Revised combination. */ export function combine(label: string, ...flags: boolean[]): number { return 1; }');
    assert.match(second, /Revised combination/);
    assert.match(second, /combine\(label: string, \.\.\.flags: boolean\[\]\)/);
    assert.match(second, /Return : number/);
    assert.doesNotMatch(second, /Original combination|first: string|suffix: string|parts: number/);

    const third = render(3, '/** Final combination. */ export function combine(value: number): void {}');
    assert.match(third, /Final combination/);
    assert.match(third, /combine\(value: number\)/);
    assert.doesNotMatch(third, /Revised combination|label: string|flags: boolean/);
});
