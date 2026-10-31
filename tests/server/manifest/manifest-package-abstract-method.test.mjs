import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown tracks an abstract method becoming concrete and abstract again', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };

    const uri = 'file:///project/services.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'services', file: { uri }, build,
        srcInfo: { available: [{ type: 1, fullName: 'Service' }] }, fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, `/** Service API. */ export abstract class Service {
        /** Load from network. */ public abstract load(key: string): Promise<string>;
    }`);
    assert.match(first, /\| load\(key: string\) \| Promise&lt;string&gt; \| \(abstract\) Load from network/);

    const second = render(2, `/** Service API. */ export class Service {
        /** Load from memory. */ public load(key: number): string { return String(key); }
    }`);
    assert.match(second, /\| load\(key: number\) \| string \| Load from memory/);
    assert.doesNotMatch(second, /\(abstract\)|Load from network|Promise&lt;string&gt;/);

    const third = render(3, `/** Service API. */ export abstract class Service {
        /** Load on demand. */ public abstract load(key: boolean): number;
    }`);
    assert.match(third, /\| load\(key: boolean\) \| number \| \(abstract\) Load on demand/);
    assert.doesNotMatch(third, /Load from memory|load\(key: number\)/);
});
