import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { loadServerModule } from './helpers/load-ts.mjs';

const { loadNodeModules, loadLibrary } = await loadServerModule('language-services/ts/libLoader.ts');

function sandbox(run) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-lib-loader-'));
    try { return run(root); }
    finally { rmSync(root, { recursive: true, force: true }); }
}

function packageFile(root, name, manifest, files) {
    const path = join(root, name);
    mkdirSync(path, { recursive: true });
    writeFileSync(join(path, 'package.json'), JSON.stringify(manifest));
    for (const [relative, content] of Object.entries(files)) {
        const filename = join(path, relative);
        mkdirSync(resolve(filename, '..'), { recursive: true });
        writeFileSync(filename, content);
    }
    return path;
}

test('npm library loader prefers declarations when a package declares TypeScript types', () => sandbox(root => {
    const nodeModules = join(root, 'node_modules');
    const pkg = packageFile(nodeModules, 'sample', {
        main: './dist/index.js', module: './dist/index.js', types: './types/index.d.ts',
    }, { 'dist/index.js': 'module.exports = 1;', 'types/index.d.ts': 'export declare const value: number;' });
    const libraries = loadNodeModules(nodeModules);
    assert.equal(libraries.length, 1);
    const declaration = libraries.find(uri => uri.endsWith('index.d.ts'));
    assert.ok(declaration);
    assert.equal(loadLibrary(declaration), 'export declare const value: number;');
    assert.ok(pkg);
}));

test('npm library loader traverses scoped packages and skips absent exported files', () => sandbox(root => {
    const nodeModules = join(root, 'node_modules');
    packageFile(nodeModules, '@scope/widget', {
        exports: { '.': { types: './types/index.d.ts' }, './missing': './missing.js' },
    }, { 'types/index.d.ts': 'export interface Widget { id: string }' });
    const libraries = loadNodeModules(nodeModules);
    assert.equal(libraries.length, 1);
    assert.equal(loadLibrary(libraries[0]), 'export interface Widget { id: string }');
}));

test('npm library loader returns no modules for absent directory or metadata', () => sandbox(root => {
    assert.deepEqual(loadNodeModules(join(root, 'missing')), []);
    mkdirSync(join(root, 'plain'));
    assert.deepEqual(loadNodeModules(root), []);
    assert.equal(loadLibrary(join(root, 'absent.d.ts')), undefined);
}));

test('malformed npm package metadata currently interrupts library discovery', () => sandbox(root => {
    const nodeModules = join(root, 'node_modules');
    const pkg = join(nodeModules, 'broken');
    mkdirSync(pkg, { recursive: true });
    writeFileSync(join(pkg, 'package.json'), '{invalid');
    assert.throws(() => loadNodeModules(nodeModules), SyntaxError);
}));
