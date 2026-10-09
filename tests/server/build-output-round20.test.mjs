import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Build } = await loadServerModule('project/Build.ts');

function setup(t) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-round20-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const build = Object.create(Build.prototype);
    build.buildConfig = { fullname: 'Demo@web', module: 'Demo' };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const code = {
        codeNoNamespaceBefore: [], code: ['class Widget { value = 1; }'],
        classesName: {}, codeNoNamespaceAfter: [], stylesheets: {}, useDecorator: false,
    };
    return { root, build, code };
}

test('output-specific compression overrides the build default for separate files', async t => {
    const { root, build, code } = setup(t);
    build.npmBuilder = { compile: async () => ({ result: '/* npm */\n', errors: [] }) };
    const main = join(root, 'main.js');
    const vendor = join(root, 'vendor.js');
    await build.writeBuildCode(code, [{ lib: 'Vendor', code: '/* vendor */\nvar vendor = 2;' }], [
        { '@default': { path: main, compressed: false }, Vendor: { path: vendor, compressed: true } },
    ], true);
    const mainText = readFileSync(main, 'utf8');
    const vendorText = readFileSync(vendor, 'utf8');
    assert.match(mainText, /class Widget \{ value = 1; \}/);
    assert.match(mainText, /\/\* npm \*\//);
    assert.doesNotMatch(vendorText, /\/\* vendor \*\//);
    assert.match(vendorText, /var vendor=2/);
});

test('npm compilation runs once and forwards its diagnostics across multiple output sets', async t => {
    const { root, build, code } = setup(t);
    let calls = 0;
    const diagnostic = { message: 'unresolved npm import' };
    build.npmBuilder = { compile: async () => {
        calls++;
        return { result: '/* npm bundle */\n', errors: [diagnostic] };
    } };
    const first = join(root, 'first.js');
    const second = join(root, 'second.js');
    const errors = await build.writeBuildCode(code, [], [
        { '@default': { path: first } },
        { '@default': { path: second } },
    ]);
    assert.equal(calls, 1);
    assert.deepEqual(errors, [diagnostic]);
    for (const path of [first, second]) {
        const output = readFileSync(path, 'utf8');
        assert.match(output, /npm bundle/);
        assert.match(output, /class Widget/);
    }
});
