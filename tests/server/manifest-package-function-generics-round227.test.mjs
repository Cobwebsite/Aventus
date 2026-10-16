import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown replaces parsed generic function signatures and documentation across revisions', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/generic-functions.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'generic-functions', file: { uri }, build,
        srcInfo: { available: [{ type: 4, fullName: 'select' }] }, fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, '/** Select a string. */ export function select<T extends string = string>(item: T): T { return item; }');
    assert.match(first, /select<T extends string = string>\(item: T\)/);
    assert.match(first, /Select a string/);
    assert.match(first, /Return : T/);

    const second = render(2, '/** Select a number. */ export function select<U extends number = number>(value: U, count: number): U[] { return [value]; }');
    assert.match(second, /select<U extends number = number>\(value: U, count: number\)/);
    assert.match(second, /Select a number/);
    assert.match(second, /Return : U\[\]/);
    assert.doesNotMatch(second, /Select a string|item: T|extends string|Return : T/);

    const third = render(3, '/** Select a flag. */ export function select(enabled: boolean): boolean { return enabled; }');
    assert.match(third, /select\(enabled: boolean\)/);
    assert.match(third, /Select a flag/);
    assert.doesNotMatch(third, /select<|Select a number|value: U|count: number|U\[\]/);
});
