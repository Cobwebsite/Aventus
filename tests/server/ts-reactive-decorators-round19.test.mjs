import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { EffectDecorator }, { SignalDecorator }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'language-services/ts/parser/decorators/EffectDecorator.ts',
    'language-services/ts/parser/decorators/SignalDecorator.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };
let nextId = 0;

function parse(source) {
    const uri = `file:///D:/test/reactive-${++nextId}.lib.avt`;
    const document = TextDocument.create(uri, 'typescript', 1, source);
    const file = { uri, versionInternal: 1, documentUser: document, documentInternal: document };
    const build = { npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '' };
    return ParserTs.parse(file, false, build).classes.Card;
}

test('Effect reads explicit autoInit false from a parsed method decorator', () => {
    const card = parse('export class Card { @Effect({autoInit:false}) public refresh(): void {} }');
    const decorator = card.methods.refresh.decorators[0];
    assert.deepEqual(EffectDecorator.is(decorator).options, { autoInit: false });
    assert.doesNotMatch(card.methods.refresh.compiledContent, /@Effect/);
});

test('Effect currently ignores a quoted autoInit property name', () => {
    const card = parse('export class Card { @Effect({"autoInit":false}) public refresh(): void {} }');
    assert.equal(EffectDecorator.is(card.methods.refresh.decorators[0]).options.autoInit, true);
});

test('Effect retains default autoInit when options are missing or malformed', () => {
    const card = parse('export class Card { @Effect() public first(): void {} @Effect({invalid:true}) public second(): void {} }');
    assert.equal(EffectDecorator.is(card.methods.first.decorators[0]).options.autoInit, true);
    assert.equal(EffectDecorator.is(card.methods.second.decorators[0]).options.autoInit, true);
});

test('Signal captures call expressions but leaves literal arguments unset', () => {
    const card = parse('export class Card { @Signal(() => true) public active: boolean = false; @Signal("static") public idle: boolean = false; }');
    assert.match(SignalDecorator.is(card.properties.active.decorators[0]).fctTxt, /=> true/);
    assert.equal(SignalDecorator.is(card.properties.idle.decorators[0]).fctTxt, null);
});
