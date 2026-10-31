import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown renews component property decorators after parsed source edits', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: resolve('.') };

    const uri = 'file:///project/card.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'card', file: { uri }, build,
        srcInfo: { available: [{ type: 1, fullName: 'Card', tagName: 'demo-card' }] }, fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        file.fileParsed.classes.Card.implements.push('Aventus.DefaultComponent');
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, `export class Card {
        /** Display state. */ @Attribute() public state: string = 'idle';
        /** Internal count. */ @Property() public count: number = 1;
    }`);
    assert.match(first, /### JS Props[\s\S]*\| state \| string \| Display state\. \| @Attribute\(\) \|/);
    assert.match(first, /\| count \| number \| Internal count\. \| @Property\(\) \|/);

    const second = render(2, `export class Card {
        /** Current phase. */ @Watch() public phase: string = 'ready';
        /** Message channel. */ @Signal() public message: string = '';
    }`);
    assert.match(second, /\| phase \| string \| Current phase\. \| @Watch\(\) \|/);
    assert.match(second, /\| message \| string \| Message channel\. \| @Signal\(\) \|/);
    assert.doesNotMatch(second, /Display state|Internal count|\| state \||\| count \|/);

    const third = render(3, `export class Card {
        /** Plain text. */ public label: string = '';
    }`);
    assert.match(third, /\| label \| string \| Plain text\. \|\s*\|/);
    assert.doesNotMatch(third, /@Attribute|@Property|@Watch|@Signal|\| phase \||\| message \|/);
});
