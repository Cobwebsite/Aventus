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

let sequence = 0;
function parse(source, { external = false, build = createBuild() } = {}) {
    const uri = `file:///D:/test/resolution-round9-${++sequence}.lib.avt`;
    const document = TextDocument.create(uri, 'typescript', 1, source);
    const file = { uri, versionInternal: 1, documentUser: document, documentInternal: document };
    return { uri, document, model: ParserTs.parse(file, external, build) };
}
function createBuild() {
    return {
        npmBuilder: { unregister() {} },
        buildConfig: {},
        hasNpmOutput: false,
        getNamespaceForUri: () => '',
        getNpmReplacementName: () => '',
    };
}

test('external parser indexes fully qualified declarations from nested namespaces', () => {
    const { model } = parse('namespace Demo { export namespace Parts { export class Card {} export type Id = string; export function make() { return 1; } } }', { external: true });
    assert.ok(model.classes['Demo.Parts.Card']);
    assert.ok(model.aliases['Demo.Parts.Id']);
    assert.ok(model.functions['Demo.Parts.make']);
    assert.equal(model.classes.Card, undefined);
    assert.equal(model.internalObjects.Card.fullname, 'Demo.Parts.Card');
    assert.equal(model.getBaseInfo('Demo.Parts.Card'), model.classes['Demo.Parts.Card']);
});

test('getBaseInfo with a source URI sees local declarations and explicit imports only', () => {
    const foreign = parse('export class Foreign {}');
    const owner = parse('export class Owner {}');
    assert.equal(ParserTs.getBaseInfo('Owner', owner.uri), owner.model.classes.Owner);
    assert.equal(ParserTs.getBaseInfo('Foreign', owner.uri), null);
    owner.model.importsLocal.Foreign = { info: foreign.model.classes.Foreign };
    assert.equal(ParserTs.getBaseInfo('Foreign', owner.uri), foreign.model.classes.Foreign);
    assert.equal(ParserTs.getBaseInfo('NoSuchDeclaration', owner.uri), null);
});

test('getBaseInfoFullName requires the complete namespace', () => {
    const { model } = parse('namespace Demo { export class Card {} }');
    assert.equal(model.classes.Card.fullName, 'Demo.Card');
    assert.equal(model.getBaseInfoFullName('Demo.Card'), model.classes.Card);
    assert.equal(model.getBaseInfoFullName('Other.Card'), null);
});
