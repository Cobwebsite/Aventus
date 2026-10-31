import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown derives visible instance and static members from parsed source after edits', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/widgets.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'widgets', file: { uri }, build,
        srcInfo: { available: [{ type: 1, fullName: 'Card' }] },
        fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, `/** Card documentation. */ export class Card {
        /** Caption. */ public title: string = '';
        /** Counter. */ public static count: number = 1;
        /** Opens card. */ public open(force?: boolean): void {}
        /** Factory. */ public static create(): Card { return new Card(); }
        private secret: string = '';
        protected reset(): void {}
    }`);
    assert.match(first, /### JS Props[\s\S]*\| title \| string \| Caption/);
    assert.match(first, /### JS Props Static[\s\S]*\| count \| number \| Counter/);
    assert.match(first, /### Methods[\s\S]*open\(force\?: boolean\)/);
    assert.match(first, /### Methods Static[\s\S]*create\(\)/);
    assert.doesNotMatch(first, /\bsecret\b|\breset\b/);

    const second = render(2, `/** New card. */ export class Card {
        public ready: boolean = true;
        public static version: number = 2;
        public close(reason: string): void {}
    }`);
    assert.match(second, /\| ready \| boolean \|/);
    assert.match(second, /\| version \| number \|/);
    assert.match(second, /close\(reason: string\)/);
    assert.doesNotMatch(second, /Caption|Counter|open\(force|create\(\)|\bsecret\b/);
});
