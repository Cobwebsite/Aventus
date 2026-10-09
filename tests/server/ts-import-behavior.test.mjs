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
function parse(source) {
    const uri = `file:///D:/test/import-round2-${++sequence}.lib.avt`;
    const document = TextDocument.create(uri, 'typescript', 1, source);
    const registrations = [];
    const file = { uri, versionInternal: 1, documentUser: document, documentInternal: document };
    const build = {
        npmBuilder: { unregister() {}, register(from, data) { registrations.push({ from, ...data }); } },
        buildConfig: {},
        hasNpmOutput: false,
        project: { resolveAlias: name => name },
        getNamespaceForUri: () => '',
        getNpmReplacementName: () => '',
    };
    return { model: ParserTs.parse(file, false, build), registrations, uri };
}

test('TS parser records named and namespace npm imports with aliases', () => {
    const { model, registrations, uri } = parse('import { Alpha as A, Beta } from "some-lib"; import * as Tools from "tool-kit"; export class User {}');
    assert.deepEqual(registrations, [
        { from: uri, libName: 'Alpha', uri: 'some-lib', alias: 'A' },
        { from: uri, libName: 'Beta', uri: 'some-lib', alias: 'Beta' },
        { from: uri, libName: '*', uri: 'tool-kit', alias: 'Tools' },
    ]);
    assert.deepEqual(model.npmImports.A, { uri: 'some-lib', nameInsideLib: 'Alpha' });
    assert.deepEqual(model.npmImports.Tools, { uri: 'tool-kit', nameInsideLib: '*' });
});

test('TS type-only npm imports do not register runtime dependencies', () => {
    const { model, registrations } = parse('import type { Shape } from "shapes"; import { type Option, Runtime } from "options"; export class User {}');
    assert.deepEqual(registrations.map(item => item.alias), ['Runtime']);
    assert.equal(model.npmImports.Shape, undefined);
    assert.equal(model.npmImports.Option, undefined);
    assert.equal(model.npmImports.Runtime.uri, 'options');
});

test('TS parser identifies package imports and diagnoses malformed package notation', () => {
    const valid = parse('import { Shape } from "demo:models.package.avt"; export class User {}').model;
    assert.equal(valid.packages.Shape.fullname, 'models.Shape');
    const invalid = parse('import { Shape } from "models.package.avt"; export class User {}').model;
    assert.ok(invalid.errors.some(error => error.message.includes('package import is malformated')));
    assert.equal(invalid.errors[0].range.start.line, 0);
});

test('TS parser records exports and members in a namespace', () => {
    const { model } = parse('namespace Demo { export class Card { value = 1; render() { return this.value; } } class Private {} }');
    assert.equal(model.internalObjects.Card.fullname, 'Demo.Card');
    assert.equal(model.internalObjects.Card.isExported, true);
    assert.equal(model.internalObjects.Private.isExported, false);
    assert.ok(model.classes.Card.properties.value);
    assert.ok(model.classes.Card.methods.render);
});
