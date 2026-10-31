import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown renews Watch and Signal decorators on a parsed component', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };
    const uri = 'file:///project/reactive.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'reactive', file: { uri }, build,
        srcInfo: { available: [{ type: 1, fullName: 'Card', tagName: 'demo-card' }] }, fileParsed: null,
    };
    const render = (version, member) => {
        const document = TextDocument.create(uri, 'typescript', version,
            `@TagName('demo-card') export class Card { ${member} }`);
        file.fileParsed = ParserTs.parse(
            { uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build,
        );
        assert.ok(file.fileParsed.classes.Card);
        file.fileParsed.classes.Card.implements.push('Aventus.DefaultComponent');
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, '@Watch() public state: string = "idle";');
    assert.match(first, /\| state \| string \|  \| @Watch\(\) \|/);

    const second = render(2, '@Signal() public state: number = 2;');
    assert.match(second, /\| state \| number \|  \| @Signal\(\) \|/);
    assert.doesNotMatch(second, /\| state \| string |@Watch\(\)/);

    const third = render(3, 'public state: boolean = true;');
    assert.match(third, /\| state \| boolean \|  \|  \|/);
    assert.doesNotMatch(third, /\| state \| number |@Signal\(\)|@Watch\(\)/);
});
