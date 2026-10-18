import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown replaces an overloaded method with its successive implementations', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/overload-revisions.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'overload-revisions', file: { uri }, build,
        srcInfo: { available: [{ type: 1, fullName: 'Converter' }] }, fileParsed: null,
    };
    const render = (version, members) => {
        const document = TextDocument.create(uri, 'typescript', version, `export class Converter {\n${members}\n}`);
        file.fileParsed = ParserTs.parse(
            { uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build,
        );
        assert.ok(file.fileParsed.classes.Converter);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, `
        public convert(value: string): string;
        public convert(value: number): number;
        /** Initial implementation. */
        public convert(value: string | number): string | number { return value; }
    `);
    assert.match(first, /convert\(value: string &vert; number\)/);
    assert.match(first, /Initial implementation/);
    assert.doesNotMatch(first, /convert\(value: string\) \| string/);

    const second = render(2, `
        public convert(value: boolean): boolean;
        /** Revised implementation. */
        public convert(value: boolean): boolean { return value; }
    `);
    assert.match(second, /convert\(value: boolean\) \| boolean \| Revised implementation\. \|/);
    assert.doesNotMatch(second, /Initial implementation|string &vert; number/);

    const third = render(3, `
        /** Final implementation. */
        public convert(value: Date): Date { return value; }
    `);
    assert.match(third, /convert\(value: Date\) \| Date \| Final implementation\. \|/);
    assert.doesNotMatch(third, /Revised implementation|value: boolean|string &vert; number/);
});
