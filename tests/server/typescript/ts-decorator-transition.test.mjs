import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('les effets des décorateurs suivent leur ajout, leur déplacement et leur retrait dans le même fichier', () => {
    const uri = 'file:///D:/round147/decorators.lib.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    function parse(version, source) {
        const document = TextDocument.create(uri, 'typescript', version, source);
        return ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
    }

    const initial = parse(1, 'export class Card { public handle(): void {} public helper(): void {} }');
    assert.equal(initial.classes.Card.methods.handle.isBindThis, false);
    assert.equal(initial.classes.Card.methods.helper.mustBeCompiled, true);

    const decorated = parse(2, 'export class Card { @BindThis() public handle(): void {} @NoCompile() public helper(): void {} }');
    assert.notEqual(decorated, initial);
    assert.equal(decorated.classes.Card.methods.handle.isBindThis, true);
    assert.equal(decorated.classes.Card.methods.helper.mustBeCompiled, false);
    assert.match(decorated.classes.Card.constructorContent, /this\.handle=this\.handle\.bind\(this\)/);

    const moved = parse(3, 'export class Card { public handle(): void {} @BindThis() public helper(): void {} }');
    assert.equal(moved.classes.Card.methods.handle.isBindThis, false);
    assert.equal(moved.classes.Card.methods.helper.isBindThis, true);
    assert.equal(moved.classes.Card.methods.helper.mustBeCompiled, true);
    assert.doesNotMatch(moved.classes.Card.constructorContent, /this\.handle=this\.handle\.bind\(this\)/);
    assert.match(moved.classes.Card.constructorContent, /this\.helper=this\.helper\.bind\(this\)/);

    const removed = parse(4, 'export class Card { public handle(): void {} public helper(): void {} }');
    assert.equal(removed.classes.Card.methods.handle.isBindThis, false);
    assert.equal(removed.classes.Card.methods.helper.isBindThis, false);
    assert.equal(removed.classes.Card.methods.helper.mustBeCompiled, true);
    assert.doesNotMatch(removed.classes.Card.constructorContent, /\.bind\(this\)/);
});
