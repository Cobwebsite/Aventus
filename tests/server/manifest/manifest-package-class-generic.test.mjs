import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown refreshes a parsed class generic constraint and default across revisions', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/class-generic.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'class-generic', file: { uri }, build,
        srcInfo: { available: [{ type: 1, fullName: 'Box' }] }, fileParsed: null,
    };
    const render = (version, declaration) => {
        const document = TextDocument.create(uri, 'typescript', version, declaration);
        file.fileParsed = ParserTs.parse(
            { uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build,
        );
        assert.ok(file.fileParsed.classes.Box);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, `/** First box. */
        export class Box<T extends string = string> {
            /** First item. */ public value!: T;
        }`);
    assert.match(first, /## Box<T extends string = string>/);
    assert.match(first, /First box\./);
    assert.match(first, /First item\./);

    const second = render(2, `/** Second box. */
        export class Box<U extends number = number> {
            /** Second item. */ public count!: U;
        }`);
    assert.match(second, /## Box<U extends number = number>/);
    assert.match(second, /Second box\./);
    assert.match(second, /Second item\./);
    assert.doesNotMatch(second, /T extends string|First box|First item|value/);

    const third = render(3, `/** Plain box. */
        export class Box {
            /** Plain item. */ public ready!: boolean;
        }`);
    assert.match(third, /## Box\r?\n/);
    assert.match(third, /Plain box\./);
    assert.match(third, /Plain item\./);
    assert.doesNotMatch(third, /U extends number|Second box|Second item|count/);
});
