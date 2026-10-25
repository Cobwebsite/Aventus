import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }] = await loadServerModules(['project/Build.ts']);

test('decorator helpers follow revisions across separate npm, library and module outputs', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-decorator-output-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const paths = {
        '@default': { path: join(root, 'module.js') },
        '@npm': { path: join(root, 'npm.js') },
        shared: { path: join(root, 'library.js') },
    };
    const build = Object.create(Build.prototype);
    build.publishedJsOutputs = new Map();
    build.buildRevision = 0;
    build.buildConfig = { fullname: 'Demo@web', module: 'Demo' };
    build.npmBuilder = { compile: async () => ({ result: 'globalThis.NpmRevision = 1;\n', errors: [] }) };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const code = (revision, useDecorator) => ({
        codeNoNamespaceBefore: [], code: [`globalThis.ModuleRevision = ${revision};`],
        classesName: {}, codeNoNamespaceAfter: [], stylesheets: {}, useDecorator,
    });
    const library = revision => [{ lib: 'shared', code: `globalThis.LibraryRevision = ${revision};` }];

    await build.writeBuildCode(code(1, true), library(1), [paths]);
    for (const output of Object.values(paths)) {
        const content = readFileSync(output.path, 'utf8');
        assert.match(content, /^var __esDecorate =/);
        assert.match(content, /var __runInitializers =/);
    }
    assert.match(readFileSync(paths['@npm'].path, 'utf8'), /NpmRevision = 1/);
    assert.match(readFileSync(paths.shared.path, 'utf8'), /LibraryRevision = 1/);
    assert.match(readFileSync(paths['@default'].path, 'utf8'), /ModuleRevision = 1/);

    build.npmBuilder.compile = async () => ({ result: 'globalThis.NpmRevision = 2;\n', errors: [] });
    await build.writeBuildCode(code(2, false), library(2), [paths]);
    for (const output of Object.values(paths)) {
        const content = readFileSync(output.path, 'utf8');
        assert.doesNotMatch(content, /__esDecorate|__runInitializers|Revision = 1/);
    }
    assert.match(readFileSync(paths['@npm'].path, 'utf8'), /NpmRevision = 2/);
    assert.match(readFileSync(paths.shared.path, 'utf8'), /LibraryRevision = 2/);
    assert.match(readFileSync(paths['@default'].path, 'utf8'), /ModuleRevision = 2/);
});
