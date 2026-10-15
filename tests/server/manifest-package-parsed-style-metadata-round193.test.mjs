import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown refreshes parsed component API with slot and CSS metadata over three revisions', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/card.package.avt';
    let styles = {};
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => styles },
    };
    const exportInfo = { type: 1, fullName: 'Card', tagName: 'demo-card', slots: {} };
    const file = {
        name: 'card', file: { uri }, build,
        srcInfo: { available: [exportInfo] }, fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        file.fileParsed.classes.Card.implements.push('Aventus.DefaultComponent');
        return new ManifestPackageMd(file).getContent();
    };

    exportInfo.slots = { header: { doc: 'Header content' } };
    styles = { 'demo-card': [{ name: '--card-tone', type: '<color>', documentation: 'Card tone' }] };
    const first = render(1, '/** First card. */ @TagName("demo-card") export class Card { public title: string = ""; }');
    assert.match(first, /First card/);
    assert.match(first, /### JS Props[\s\S]*\| title \| string \|/);
    assert.match(first, /### HTML Slots[\s\S]*\| header \| Header content \|/);
    assert.match(first, /### CSS Props[\s\S]*\| --card-tone \| <color> \| Card tone \|/);

    exportInfo.slots = { footer: { doc: 'Footer content' } };
    styles = { 'demo-card': [{ name: '--card-gap', type: '<length>', documentation: 'Card gap' }] };
    const second = render(2, '/** Revised card. */ @TagName("demo-card") export class Card { public count: number = 1; }');
    assert.match(second, /Revised card/);
    assert.match(second, /### JS Props[\s\S]*\| count \| number \|/);
    assert.match(second, /### HTML Slots[\s\S]*\| footer \| Footer content \|/);
    assert.match(second, /### CSS Props[\s\S]*\| --card-gap \| <length> \| Card gap \|/);
    assert.doesNotMatch(second, /First card|\btitle\b|\bheader\b|--card-tone/);

    exportInfo.slots = {};
    styles = {};
    const third = render(3, '/** Plain card. */ @TagName("demo-card") export class Card {}');
    assert.match(third, /Plain card/);
    assert.doesNotMatch(third, /### JS Props|### HTML Slots|### CSS Props|\bfooter\b|--card-gap|Revised card/);
});
