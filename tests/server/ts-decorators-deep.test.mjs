import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };
let fixtureId = 0;

function parse(source) {
    const uri = `file:///D:/test/decorators-${++fixtureId}.lib.avt`;
    const document = TextDocument.create(uri, 'typescript', 1, source);
    const file = { uri, versionInternal: 1, documentUser: document, documentInternal: document };
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    return ParserTs.parse(file, false, build);
}

test('decorator calls are indexed with argument values and source spans', () => {
    const source = '@TagName("x-card")\nexport class Card { @Property(() => true) public active: boolean = false; }';
    const model = parse(source);
    const card = model.classes.Card;
    assert.equal(card.decorators[0].name, 'TagName');
    assert.equal(card.decorators[0].arguments[0].value, '"x-card"');
    assert.equal(source.slice(card.decorators[0].start, card.decorators[0].end), '@TagName("x-card")');
    assert.equal(card.properties.active.decorators[0].name, 'Property');
    assert.ok(card.compileTransformations[`${card.decorators[0].start}_${card.decorators[0].end}`]);
});

test('bare decorator reports diagnostic with position rather than entering model', () => {
    const model = parse('@TagName\nexport class Card {}');
    assert.deepEqual(model.classes.Card.decorators, []);
    assert.ok(model.errors.some(error => error.message.includes('Missing paramaters for Decorator') && error.range.start.line === 0));
});

test('normal decorator remains in compiled source while Aventus decorator is erased', () => {
    const model = parse('@Custom() @TagName("x-card")\nexport class Card {}');
    const card = model.classes.Card;
    assert.equal(card.useNormalDecorator, true);
    assert.match(card.compiledContent, /@Custom\(\)/);
    assert.doesNotMatch(card.compiledContent, /@TagName/);
});

test('BindThis and NoCompile alter method model and constructor generation', () => {
    const model = parse('export class Card { @BindThis() public handle(): void {} @NoCompile() public helper(): void {} }');
    const card = model.classes.Card;
    assert.equal(card.methods.handle.isBindThis, true);
    assert.equal(card.methods.helper.mustBeCompiled, false);
    assert.match(card.constructorContent, /this\.handle=this\.handle\.bind\(this\)/);
});

test('Internal and Deprecated change property metadata and compiled accessibility', () => {
    const model = parse('export class Card { @Internal() @Deprecated("Use next") public old: string = "x"; }');
    const property = model.classes.Card.properties.old;
    assert.equal(property.isPrivate, true);
    assert.equal(property.deprecated, true);
    assert.equal(property.deprecatedMsg, '"Use next"');
    assert.match(property.compiledContent, /private old/);
    assert.doesNotMatch(property.compiledContent, /@Internal|@Deprecated/);
});

test('missing type and accessibility modifier produce errors at member positions', () => {
    const source = 'export class Card { title = "x"; run(): void {} }';
    const model = parse(source);
    assert.ok(model.errors.some(error => error.message.includes('must define a type for the prop title')));
    assert.ok(model.errors.some(error => error.message.includes('accessibility modifier') && error.range.start.character === source.indexOf('title')));
    assert.ok(model.errors.some(error => error.message.includes('accessibility modifier') && error.range.start.character === source.indexOf('run')));
});

test('NoType decorator suppresses inferred property type error only', () => {
    const model = parse('export class Card { @NoType() public title = "x"; }');
    assert.equal(model.errors.some(error => error.message.includes('must define a type for the prop title')), false);
    assert.ok(model.errors.some(warning => warning.severity === 2 && warning.message.includes('documentation for title')));
});
