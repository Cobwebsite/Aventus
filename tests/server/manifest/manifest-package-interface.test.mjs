import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown refreshes a parsed interface and its members after an edit', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/contracts.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'contracts', file: { uri }, build,
        srcInfo: { available: [{ type: 3, fullName: 'Shape' }] },
        fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, `/** Original shape. */ export interface Shape {
        /** Width description. */ width: number;
        /** Draw description. */ draw(scale: number): string;
    }`);
    assert.match(first, /Interface/);
    assert.match(first, /Original shape/);
    assert.match(first, /width/);
    assert.match(first, /draw\(scale: number\)/);

    const second = render(2, `/** Revised shape. */ export interface Shape {
        /** Height description. */ height: string;
        /** Paint description. */ paint(color: string): boolean;
    }`);
    assert.match(second, /Revised shape/);
    assert.match(second, /height/);
    assert.match(second, /paint\(color: string\)/);
    assert.doesNotMatch(second, /Original shape|Width description|Draw description|draw\(scale|\bwidth\b/);
});
