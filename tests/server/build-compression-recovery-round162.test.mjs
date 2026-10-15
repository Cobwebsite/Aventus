import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules(['project/Build.ts', 'GenericServer.ts']);

function setup(t) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-compression-retry-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const build = Object.create(Build.prototype);
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

test('minifier failure reports the error and a later valid revision compacts successfully', async t => {
    const { root, build } = setup(t);
    const output = join(root, 'main.js');
    const oldError = GenericServer.error;
    const errors = [];
    GenericServer.error = error => errors.push(error);
    t.after(() => { GenericServer.error = oldError; });
    const outputs = [{ '@default': { path: output, compressed: true } }];

    await build.writeBuildCode(code('const =;'), [], outputs);
    assert.equal(errors.length, 1);
    assert.match(readFileSync(output, 'utf8'), /const =;/);

    await build.writeBuildCode(code('globalThis.Recovered = class Recovered { value = 7; };'), [], outputs);
    const content = readFileSync(output, 'utf8');
    assert.match(content, /globalThis\.Recovered=class/);
    assert.doesNotMatch(content, /const =;|value = 7/);
    assert.equal(errors.length, 1);
});
