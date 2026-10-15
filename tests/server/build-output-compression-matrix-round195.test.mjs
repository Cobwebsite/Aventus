import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }] = await loadServerModules(['project/Build.ts']);

function localCode(name) {
    return {
        codeNoNamespaceBefore: [], code: [`globalThis.${name} = class ${name} { value = 12; };`],
        classesName: {}, codeNoNamespaceAfter: [], stylesheets: {}, useDecorator: false,
    };
}

test('each routed output honors its compression override across a full output revision', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-compression-matrix-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const paths = Object.fromEntries(['main', 'vendor', 'npm'].map(name => [name, join(root, `${name}.js`)]));
    const build = Object.create(Build.prototype);
    build.buildConfig = { fullname: 'Demo@web', module: 'Demo' };
    let revision = 'First';
    build.npmBuilder = { compile: async () => ({ result: `globalThis.Npm${revision} = 123;\n`, errors: [] }) };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const libraries = () => [{ lib: 'Vendor', code: `globalThis.Vendor${revision} = 456;` }];
    const outputs = (mainCompressed, vendorCompressed, npmCompressed) => [{
        '@default': { path: paths.main, compressed: mainCompressed },
        Vendor: { path: paths.vendor, compressed: vendorCompressed },
        '@npm': { path: paths.npm, compressed: npmCompressed },
    }];
    const content = name => readFileSync(paths[name], 'utf8');

    assert.deepEqual(await build.writeBuildCode(localCode(revision), libraries(), outputs(false, true, false), true), []);
    assert.match(content('main'), /class First \{ value = 12; \}/);
    assert.match(content('vendor'), /VendorFirst=456/);
    assert.doesNotMatch(content('vendor'), /VendorFirst = 456/);
    assert.match(content('npm'), /NpmFirst = 123/);
    for (const name of ['main', 'vendor', 'npm']) {
        assert.doesNotMatch(content(name), /(?:Npm|Vendor)Second|class Second/);
    }

    revision = 'Second';
    assert.deepEqual(await build.writeBuildCode(localCode(revision), libraries(), outputs(true, false, true), false), []);
    assert.match(content('main'), /globalThis\.Second=class/);
    assert.match(content('vendor'), /VendorSecond = 456/);
    assert.match(content('npm'), /NpmSecond=123/);
    for (const name of ['main', 'vendor', 'npm']) {
        assert.doesNotMatch(content(name), /First/);
    }
    assert.doesNotMatch(content('main'), /VendorSecond|NpmSecond/);
    assert.doesNotMatch(content('vendor'), /class Second|NpmSecond/);
    assert.doesNotMatch(content('npm'), /class Second|VendorSecond/);
});
