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

function parse(source, version = 1, uri = 'file:///D:/test/model.lib.avt') {
    const document = TextDocument.create(uri, 'typescript', version, source);
    const file = { uri, versionInternal: version, documentUser: document, documentInternal: document };
    const build = {
        npmBuilder: { unregister() {} },
        buildConfig: {},
        hasNpmOutput: false,
        getNamespaceForUri: () => '',
        getNpmReplacementName: () => '',
    };
    return ParserTs.parse(file, false, build);
}

test('TypeScript parser indexes declarations and namespaces', () => {
    const model = parse('namespace Example { export class Widget { value = 1; run() {} } export interface Shape { size: number } export enum State { Ready } export type Name = string; export function make() { return 1; } export const enabled = true; }');
    assert.equal(model.internalObjects.Widget.fullname, 'Example.Widget');
    assert.equal(model.internalObjects.Shape.isCompiled, false);
    assert.equal(model.internalObjects.State.isCompiled, true);
    assert.equal(model.internalObjects.Name.isCompiled, false);
    assert.equal(model.internalObjects.make.isCompiled, true);
    assert.equal(model.internalObjects.enabled.isCompiled, true);
    assert.ok(model.getBaseInfo('Widget'));
    assert.equal(model.getBaseInfo('Missing'), null);
});

test('TypeScript parser caches by file version and refreshes on change', () => {
    const uri = 'file:///D:/test/cached.lib.avt';
    const first = parse('export class First {}', 1, uri);
    assert.equal(parse('export class Ignored {}', 1, uri), first);
    const second = parse('export class Second {}', 2, uri);
    assert.notEqual(second, first);
    assert.ok(second.internalObjects.Second);
    assert.equal(second.internalObjects.First, undefined);
});

test('TypeScript parser reports module syntax that must be a namespace', () => {
    const model = parse('module OldStyle { export class Thing {} }', 1, 'file:///D:/test/old-module.lib.avt');
    assert.ok(model.errors.some(error => error.message.includes('use namespace instead')));
    assert.equal(model.errors[0].range.start.line, 0);
});

test('TypeScript parser resolves declaration names and registers npm imports once', () => {
    const model = parse('export class Thing {}', 1, 'file:///D:/test/names.lib.avt');
    assert.equal(model.getBaseInfoFullName('Any.Thing'), model.classes.Thing);
    assert.equal(model.getBaseInfoFullName('Any.Missing'), null);
    model.build.hasNpmOutput = true;
    model.registerGeneratedImport({ uri: 'package-a', name: 'Thing', alias: 'ThingAlias', compiled: true, forced: false });
    model.registerGeneratedImport({ uri: 'package-a', name: 'Thing', alias: 'ThingAlias', compiled: true, forced: false });
    assert.deepEqual(model.npmGeneratedImport['package-a'], [{
        name: 'Thing', nameAlias: undefined, compiled: true,
        alias: 'ThingAlias', onlySrc: undefined, forced: false,
    }]);
});
