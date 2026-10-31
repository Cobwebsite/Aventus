import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { loadNodeModules, loadLibrary } = await loadServerModule('language-services/ts/libLoader.ts');

function withModules(run) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-lib-discovery-'));
    const modules = join(root, 'node_modules');
    mkdirSync(modules);
    try { return run(modules); }
    finally { rmSync(root, { recursive: true, force: true }); }
}

function putPackage(modules, name, manifest, files = {}) {
    const folder = join(modules, name);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'package.json'), manifest);
    for (const [relative, content] of Object.entries(files)) {
        const path = join(folder, relative);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    }
    return folder;
}

test('npm declaration discovery follows package installation and removal in the same process', () => withModules(modules => {
    assert.deepEqual(loadNodeModules(modules), []);
    const first = putPackage(modules, 'first', JSON.stringify({ types: './index.d.ts' }), {
        'index.d.ts': 'export declare const first: 1;',
    });
    let paths = loadNodeModules(modules);
    assert.equal(paths.length, 1);
    assert.equal(loadLibrary(paths[0]), 'export declare const first: 1;');

    putPackage(modules, '@scope/second', JSON.stringify({ exports: { '.': { types: './api.d.ts' } } }), {
        'api.d.ts': 'export declare const second: 2;',
    });
    paths = loadNodeModules(modules);
    assert.equal(paths.length, 2);
    assert.deepEqual(paths.map(loadLibrary).sort(), [
        'export declare const first: 1;', 'export declare const second: 2;',
    ]);

    rmSync(first, { recursive: true, force: true });
    paths = loadNodeModules(modules);
    assert.equal(paths.length, 1);
    assert.equal(loadLibrary(paths[0]), 'export declare const second: 2;');
}));

test('missing npm declaration is ignored until it appears and disappears again', () => withModules(modules => {
    const folder = putPackage(modules, 'pending', JSON.stringify({ types: './types/index.d.ts' }));
    assert.deepEqual(loadNodeModules(modules), []);
    const declaration = join(folder, 'types/index.d.ts');
    mkdirSync(dirname(declaration));
    writeFileSync(declaration, 'export declare const pending: true;');
    const found = loadNodeModules(modules);
    assert.equal(found.length, 1);
    assert.equal(loadLibrary(found[0]), 'export declare const pending: true;');
    unlinkSync(declaration);
    assert.deepEqual(loadNodeModules(modules), []);
}));

test('malformed npm metadata can be repaired and rediscovered with a valid sibling', () => withModules(modules => {
    putPackage(modules, 'healthy', JSON.stringify({ types: './index.d.ts' }), {
        'index.d.ts': 'export declare const healthy: true;',
    });
    const broken = putPackage(modules, 'broken', '{', {
        'index.d.ts': 'export declare const repaired: true;',
    });
    const originalError = console.error;
    const diagnostics = [];
    console.error = message => diagnostics.push(message);
    try {
        const paths = loadNodeModules(modules);
        assert.equal(paths.length, 1);
        assert.equal(loadLibrary(paths[0]), 'export declare const healthy: true;');
    }
    finally {
        console.error = originalError;
    }
    assert.equal(diagnostics.length, 1);
    assert.match(diagnostics[0], /broken[\\/]package\.json/);
    writeFileSync(join(broken, 'package.json'), JSON.stringify({ types: './index.d.ts' }));
    const paths = loadNodeModules(modules);
    assert.equal(paths.length, 2);
    assert.deepEqual(paths.map(loadLibrary).sort(), [
        'export declare const healthy: true;', 'export declare const repaired: true;',
    ]);
}));

test('library content cache refreshes a changed declaration and forgets a removed one', () => withModules(modules => {
    const folder = putPackage(modules, 'mutable', JSON.stringify({ types: './index.d.ts' }), {
        'index.d.ts': 'export declare const revision: 1;',
    });
    const [uri] = loadNodeModules(modules);
    assert.equal(loadLibrary(uri), 'export declare const revision: 1;');
    writeFileSync(join(folder, 'index.d.ts'), 'export declare const revision: 2;');
    assert.deepEqual(loadNodeModules(modules), [uri]);
    assert.equal(loadLibrary(uri), 'export declare const revision: 2;');
    unlinkSync(join(folder, 'index.d.ts'));
    assert.equal(loadLibrary(uri), undefined);
    writeFileSync(join(folder, 'index.d.ts'), 'export declare const revision: 3;');
    assert.equal(loadLibrary(uri), 'export declare const revision: 3;');
}));
