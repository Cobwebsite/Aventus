import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { DebugFileAdd }] = await loadServerModules(['project/Build.ts', 'GenericServer.ts', 'notification/DebugFileAdd.ts']);

function setup(t) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-compression-retry-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const build = Object.create(Build.prototype);
    build.publishedJsOutputs = new Map();
    build.buildRevision = 0;
    build.buildConfig = { fullname: 'Demo@web', module: 'Demo' };
    build.npmBuilder = { compile: async () => ({ result: '', errors: [] }) };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    return { root, build };
}

function code(value) {
    return {
        codeNoNamespaceBefore: [], code: [value], classesName: {},
        codeNoNamespaceAfter: [], stylesheets: {}, useDecorator: false,
    };
}

test('switching an output between compressed and plain form replaces its previous bytes', async t => {
    const { root, build } = setup(t);
    const output = join(root, 'main.js');
    const plain = [{ '@default': { path: output, compressed: false } }];
    const compressed = [{ '@default': { path: output, compressed: true } }];

    await build.writeBuildCode(code('globalThis.First = class First { value = 1; };'), [], plain, true);
    assert.match(readFileSync(output, 'utf8'), /class First \{ value = 1; \}/);

    await build.writeBuildCode(code('globalThis.Second = class Second { value = 2; };'), [], compressed, false);
    const compact = readFileSync(output, 'utf8');
    assert.match(compact, /globalThis\.Second=class/);
    assert.doesNotMatch(compact, /First|value = 2/);

    await build.writeBuildCode(code('globalThis.Third = class Third { value = 3; };'), [], plain, true);
    const restored = readFileSync(output, 'utf8');
    assert.match(restored, /class Third \{ value = 3; \}/);
    assert.doesNotMatch(restored, /First|Second/);
});

test('minifier failure reports a build error and preserves the last valid output until recovery', async t => {
    const { root, build } = setup(t);
    const output = join(root, 'main.js');
    const oldError = GenericServer.error;
    const oldDebugSend = DebugFileAdd.send;
    const errors = [];
    const debugFiles = [];
    GenericServer.error = error => errors.push(error);
    DebugFileAdd.send = (uri, content) => debugFiles.push({ uri, content });
    t.after(() => { GenericServer.error = oldError; DebugFileAdd.send = oldDebugSend; });
    const outputs = [{ '@default': { path: output, compressed: true } }];

    const initialResult = await build.writeBuildCode(code('globalThis.Initial = 1;'), [], outputs);
    const previous = readFileSync(output, 'utf8');
    assert.deepEqual(initialResult, []);
    assert.match(previous, /globalThis\.Initial=1/);

    const failedResult = await build.writeBuildCode(code('const =;'), [], outputs);
    assert.equal(errors.length, 1);
    assert.equal(readFileSync(output, 'utf8'), previous);
    assert.deepEqual(failedResult, [{ file: 'Demo@web_minificationErrors', title: 'Minification errors' }]);
    assert.equal(debugFiles.length, 1);
    assert.equal(debugFiles[0].uri, failedResult[0].file);
    assert.match(debugFiles[0].content, /main\.js/);

    const recoveredResult = await build.writeBuildCode(code('globalThis.Recovered = class Recovered { value = 7; };'), [], outputs);
    const content = readFileSync(output, 'utf8');
    assert.match(content, /globalThis\.Recovered=class/);
    assert.doesNotMatch(content, /const =;|value = 7/);
    assert.equal(errors.length, 1);
    assert.deepEqual(recoveredResult, []);
});

test('a failed compressed destination does not block another output from the same build', async t => {
    const { root, build } = setup(t);
    const main = join(root, 'main.js');
    const vendor = join(root, 'vendor.js');
    const oldError = GenericServer.error;
    const oldDebugSend = DebugFileAdd.send;
    GenericServer.error = () => {};
    DebugFileAdd.send = () => {};
    t.after(() => { GenericServer.error = oldError; DebugFileAdd.send = oldDebugSend; });
    const outputs = [{ '@default': { path: main, compressed: false }, vendor: { path: vendor, compressed: true } }];

    const result = await build.writeBuildCode(code('globalThis.Current = 2;'), [{ lib: 'vendor', code: 'const =;' }], outputs);
    assert.match(readFileSync(main, 'utf8'), /globalThis\.Current = 2/);
    assert.equal(existsSync(vendor), false);
    assert.deepEqual(result, [{ file: 'Demo@web_minificationErrors', title: 'Minification errors' }]);
});
