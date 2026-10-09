import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Build } = await loadServerModule('project/Build.ts');

function fixture(t) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-transition-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const build = Object.create(Build.prototype);
    build.buildConfig = { fullname: 'Demo@web', module: 'Demo' };
    build.npmBuilder = { compile: async () => ({ result: '/* npm */\n', errors: [] }) };
    build.writeFile = async (path, contents) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, contents);
    };
    const code = name => ({
        codeNoNamespaceBefore: [], code: [`class ${name} {}`], classesName: {},
        codeNoNamespaceAfter: [], stylesheets: {}, useDecorator: false,
    });
    return { root, build, code };
}

test('a rebuild moves a library from the default output into its configured output', async t => {
    const { root, build, code } = fixture(t);
    const main = join(root, 'main.js');
    const vendor = join(root, 'vendor.js');
    const lib = [{ lib: 'Vendor', code: '/* vendor code */' }];
    await build.writeBuildCode(code('First'), lib, [{ '@default': { path: main } }]);
    assert.match(readFileSync(main, 'utf8'), /vendor code/);

    await build.writeBuildCode(code('Second'), lib, [{
        '@default': { path: main }, Vendor: { path: vendor },
    }]);
    assert.match(readFileSync(vendor, 'utf8'), /vendor code/);
    assert.doesNotMatch(readFileSync(main, 'utf8'), /vendor code|First/);
    assert.match(readFileSync(main, 'utf8'), /Second/);
});

test('a failed output write permits a subsequent rebuild to replace the file', async t => {
    const { root, build, code } = fixture(t);
    const output = join(root, 'nested', 'main.js');
    const config = [{ '@default': { path: output } }];
    const write = build.writeFile;
    build.writeFile = async () => { throw new Error('disk unavailable'); };
    await assert.rejects(build.writeBuildCode(code('Failed'), [], config), /disk unavailable/);
    build.writeFile = write;
    assert.deepEqual(await build.writeBuildCode(code('Recovered'), [], config), []);
    assert.match(readFileSync(output, 'utf8'), /Recovered/);
    assert.doesNotMatch(readFileSync(output, 'utf8'), /Failed/);
});
