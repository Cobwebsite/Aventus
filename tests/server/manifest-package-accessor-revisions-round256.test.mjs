import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown renews parsed public accessors while omitting private members', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/accessors.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'accessors', file: { uri }, build,
        srcInfo: { available: [{ type: 1, fullName: 'Accessor' }] }, fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        assert.ok(file.fileParsed.classes.Accessor);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, `export class Accessor {
        private secret: string = '';
        /** Read the count. */ get count(): number { return 1; }
    }`);
    assert.match(first, /### JS Props[\s\S]*\| count \| number \| Read the count/);
    assert.doesNotMatch(first, /secret/);

    const second = render(2, `export class Accessor {
        /** Read the label. */ get label(): string { return ''; }
        /** Write the label. */ set label(value: string) {}
    }`);
    assert.match(second, /\| label \| string \| Read the label/);
    assert.doesNotMatch(second, /Read the count|\| count \||secret/);

    const third = render(3, 'export class Accessor {}');
    assert.doesNotMatch(third, /### JS Props|Read the label|Read the count|\| label \||\| count \|/);
});
