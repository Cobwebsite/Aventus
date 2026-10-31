import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown moves parsed members between visibility and static sections across revisions', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/visibility.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'visibility', file: { uri }, build,
        srcInfo: { available: [{ type: 1, fullName: 'Control' }] }, fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        assert.ok(file.fileParsed.classes.Control);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, `export class Control {
        /** Current state. */ public state: string = '';
        /** Current action. */ public run(): void {}
    }`);
    assert.match(first, /### JS Props\s+[\s\S]*\| state \| string \| Current state/);
    assert.match(first, /### Methods\s+[\s\S]*run\(\)/);
    assert.doesNotMatch(first, /### JS Props Static|### Methods Static/);

    const second = render(2, `export class Control {
        /** Shared state. */ public static state: number = 1;
        /** Shared action. */ public static run(): number { return 1; }
    }`);
    assert.match(second, /### JS Props Static\s+[\s\S]*\| state \| number \| Shared state/);
    assert.match(second, /### Methods Static\s+[\s\S]*run\(\).*number/);
    assert.doesNotMatch(second, /### JS Props\r?\n|### Methods\r?\n|Current state|Current action/);

    const third = render(3, `export class Control {
        protected static state: boolean = true;
        private static run(): void {}
        /** New public member. */ public ready: boolean = true;
    }`);
    assert.match(third, /### JS Props\s+[\s\S]*\| ready \| boolean \| New public member/);
    assert.doesNotMatch(third, /\| state \||run\(\)|Shared state|Shared action|### JS Props Static|### Methods Static/);
});
