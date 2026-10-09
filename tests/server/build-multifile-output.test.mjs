import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Build } = await loadServerModule('project/Build.ts');

function fixture(t, npm = '') {
    const root = mkdtempSync(join(import.meta.dirname, '.build-multifile-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const build = Object.create(Build.prototype);
    build.buildConfig = { fullname: 'Demo@web', module: 'Demo' };
    build.npmBuilder = { compile: async () => ({ result: npm, errors: [] }) };
    build.writeFile = async (path, content) => {
        mkdirSync(join(path, '..'), { recursive: true });
        const { writeFileSync } = await import('node:fs');
        writeFileSync(path, content);
    };
    return { build, root };
}

function code(value) {
    return {
        codeNoNamespaceBefore: [], code: [`class ${value} {}`],
        classesName: {}, codeNoNamespaceAfter: [], stylesheets: {}, useDecorator: false,
    };
}

test('code build routes npm, named libraries and local module to their configured files', async t => {
    const { build, root } = fixture(t, '/* npm marker */\n');
    const main = join(root, 'dist', 'main.js');
    const vendor = join(root, 'dist', 'vendor.js');
    const npm = join(root, 'dist', 'npm.js');
    const errors = await build.writeBuildCode(code('Widget'), [
        { lib: 'Shared', code: '/* shared marker */' },
        { lib: 'Unknown', code: '/* fallback marker */' },
    ], [{ '@default': { path: main }, Shared: { path: vendor }, '@npm': { path: npm } }]);

    assert.deepEqual(errors, []);
    assert.match(readFileSync(main, 'utf8'), /class Widget/);
    assert.match(readFileSync(main, 'utf8'), /fallback marker/);
    assert.doesNotMatch(readFileSync(main, 'utf8'), /shared marker|npm marker/);
    assert.match(readFileSync(vendor, 'utf8'), /shared marker/);
    assert.doesNotMatch(readFileSync(vendor, 'utf8'), /class Widget|fallback marker|npm marker/);
    assert.match(readFileSync(npm, 'utf8'), /npm marker/);
    assert.doesNotMatch(readFileSync(npm, 'utf8'), /class Widget|shared marker/);
});

test('shared output path is written once with npm, libraries and module content', async t => {
    const { build, root } = fixture(t, '/* npm marker */\n');
    const output = join(root, 'combined.js');
    const writes = [];
    const original = build.writeFile;
    build.writeFile = async (...args) => { writes.push(args[0]); await original(...args); };
    await build.writeBuildCode(code('Widget'), [{ lib: 'Shared', code: '/* shared marker */' }],
        [{ '@default': { path: output }, '@npm': { path: output }, Shared: { path: output } }]);

    assert.deepEqual(writes, [output]);
    const content = readFileSync(output, 'utf8');
    for (const marker of ['npm marker', 'shared marker', 'class Widget']) assert.match(content, new RegExp(marker));
});

test('a second code build replaces removed classes and libraries in the output', async t => {
    const { build, root } = fixture(t);
    const output = join(root, 'main.js');
    const config = [{ '@default': { path: output } }];
    await build.writeBuildCode(code('OldWidget'), [{ lib: 'Old', code: '/* old lib */' }], config);
    await build.writeBuildCode(code('NewWidget'), [], config);
    const content = readFileSync(output, 'utf8');
    assert.match(content, /class NewWidget/);
    assert.doesNotMatch(content, /OldWidget|old lib/);
});

test('code build passes npm compilation errors to its caller even without a code output', async t => {
    const { build, root } = fixture(t);
    const npmError = { message: 'missing dependency' };
    build.npmBuilder.compile = async () => ({ result: '', errors: [npmError] });
    const output = join(root, 'main.js');
    assert.deepEqual(await build.writeBuildCode(code('Widget'), [], [{ '@default': { path: output } }]), [npmError]);
});
