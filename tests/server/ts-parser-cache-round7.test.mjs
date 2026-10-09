import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

let sequence = 0;
function file(source, uri = `file:///D:/test/parse-cache-round7-${++sequence}.lib.avt`, version = 1) {
    const document = TextDocument.create(uri, 'typescript', version, source);
    return { uri, versionInternal: version, documentUser: document, documentInternal: document };
}
function build() {
    const unregistered = [];
    return {
        unregistered,
        npmBuilder: { unregister(uri) { unregistered.push(uri); } },
        buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
}

test('parser cache reuses a version and refreshes declarations and npm registrations on increment', () => {
    const uri = 'file:///D:/test/parse-cache-refresh-round7.lib.avt';
    const firstBuild = build();
    const first = ParserTs.parse(file('export class First {}', uri, 1), false, firstBuild);
    assert.equal(ParserTs.parse(file('export class Ignored {}', uri, 1), false, firstBuild), first);
    assert.deepEqual(firstBuild.unregistered, [uri]);
    const second = ParserTs.parse(file('export class Second {}', uri, 2), false, firstBuild);
    assert.notEqual(second, first);
    assert.equal(second.classes.First, undefined);
    assert.ok(second.classes.Second);
    assert.deepEqual(firstBuild.unregistered, [uri, uri]);
});

test('parser cache currently shares the same URI/version result between distinct builds', () => {
    const uri = 'file:///D:/test/parse-cache-cross-build-round7.lib.avt';
    const firstBuild = build();
    const secondBuild = build();
    const input = file('export class Shared {}', uri);
    const first = ParserTs.parse(input, false, firstBuild);
    const second = ParserTs.parse(input, false, secondBuild);
    assert.equal(second, first);
    assert.equal(second.build, firstBuild);
    assert.deepEqual(firstBuild.unregistered, [uri]);
    assert.deepEqual(secondBuild.unregistered, []);
});

test('parser cache currently shares internal and external views of the same URI/version', () => {
    const uri = 'file:///D:/test/parse-cache-external-round7.lib.avt';
    const projectBuild = build();
    const input = file('namespace Demo { export class Shared {} }', uri);
    const internal = ParserTs.parse(input, false, projectBuild);
    const external = ParserTs.parse(input, true, projectBuild);
    assert.equal(external, internal);
    assert.equal(external.isExternal, false);
    assert.ok(external.classes.Shared);
    assert.equal(external.classes['Demo.Shared'], undefined);
});
