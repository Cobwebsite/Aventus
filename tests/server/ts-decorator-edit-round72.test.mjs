import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { WatchDecorator }, { PropertyDecorator }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'language-services/ts/parser/decorators/WatchDecorator.ts',
    'language-services/ts/parser/decorators/PropertyDecorator.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };
const uri = 'file:///D:/test/decorator-edit-round72.lib.avt';
const build = { npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
    getNamespaceForUri: () => '', getNpmReplacementName: () => '' };

function parse(source, version) {
    const document = TextDocument.create(uri, 'typescript', version, source);
    return ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
}

test('editing decorators refreshes method and property metadata and erasure spans', () => {
    const firstSource = 'export class Card {\n  @Watch(() => this.refresh())\n  public count: number = 0;\n  @BindThis()\n  public refresh(): void {}\n}';
    const first = parse(firstSource, 1).classes.Card;
    assert.match(WatchDecorator.is(first.properties.count.decorators[0]).fctTxt, /this\.refresh\(\)/);
    assert.equal(first.methods.refresh.isBindThis, true);
    assert.match(first.constructorContent, /this\.refresh=this\.refresh\.bind\(this\)/);

    const secondSource = 'export class Card {\n  @Property("literal")\n  public count: number = 0;\n  @NoCompile()\n  public refresh(): void {}\n}';
    const second = parse(secondSource, 2).classes.Card;
    assert.equal(WatchDecorator.is(second.properties.count.decorators[0]), null);
    assert.equal(PropertyDecorator.is(second.properties.count.decorators[0]).fctTxt, null);
    assert.equal(second.methods.refresh.isBindThis, false);
    assert.equal(second.methods.refresh.mustBeCompiled, false);
    assert.doesNotMatch(second.constructorContent, /this\.refresh=this\.refresh\.bind/);
    for (const decorator of [second.properties.count.decorators[0], second.methods.refresh.decorators[0]]) {
        assert.equal(secondSource.slice(decorator.start, decorator.end), decorator.content);
        assert.equal(second.compileTransformations[`${decorator.start}_${decorator.end}`].newText, '');
    }
});

test('moving a malformed decorator refreshes its diagnostic range without retaining old member metadata', () => {
    const valid = parse('export class Card { @Watch(() => true) public active: boolean = false; }', 3);
    assert.equal(valid.classes.Card.properties.active.decorators.length, 1);
    const source = '\n\nexport class Card {\n  @Watch\n  public active: boolean = false;\n}';
    const moved = parse(source, 4);
    const error = moved.errors.find(item => item.message === 'Missing paramaters for Decorator');
    assert.equal(source.slice(moved.document.offsetAt(error.range.start), moved.document.offsetAt(error.range.end)), '@Watch');
    assert.deepEqual(error.range.start, { line: 3, character: 2 });
    assert.deepEqual(moved.classes.Card.properties.active.decorators, []);
});
