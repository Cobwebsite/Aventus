import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModule } from './helpers/load-ts.mjs';

const { loadNodeModules, loadLibrary } = await loadServerModule('language-services/ts/libLoader.ts');

function fixture(run) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-lib-boundaries-'));
    const modules = join(root, 'node_modules');
    mkdirSync(modules);
    try { return run(root, modules); }
    finally { rmSync(root, { recursive: true, force: true }); }
}

function addPackage(modules, name, manifest, files = {}) {
    const folder = join(modules, name);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'package.json'), JSON.stringify(manifest));
    for (const [name, body] of Object.entries(files)) {
        const file = join(folder, name);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, body);
    }
    return folder;
}

test('npm discovery handles missing entry points and a declaration-only sibling independently', () => fixture((_, modules) => {
    addPackage(modules, 'empty', { main: './missing.js', types: './missing.d.ts' });
    addPackage(modules, 'typed', { typings: './types/index.d.ts' }, {
        'types/index.d.ts': 'export interface Available { value: number }',
    });
    const found = loadNodeModules(modules);
    assert.equal(found.length, 1);
    assert.equal(loadLibrary(found[0]), 'export interface Available { value: number }');
}));

test('npm discovery accepts an export array fallback when the first candidate is absent', () => fixture((_, modules) => {
    addPackage(modules, 'fallback', { exports: { '.': ['./missing.d.ts', './present.d.ts'] } }, {
        'present.d.ts': 'export declare const fallback: true;',
    });
    const found = loadNodeModules(modules);
    assert.equal(found.length, 1);
    assert.equal(loadLibrary(found[0]), 'export declare const fallback: true;');
}));

test('library loading accepts encoded file URIs and returns undefined after a missing file appears only on a later call', () => fixture((root) => {
    const file = join(root, 'declaration with spaces.d.ts');
    const uri = pathToFileURL(file).href;
    assert.equal(loadLibrary(uri), undefined);
    writeFileSync(file, 'export declare const unicode: "été";');
    assert.equal(loadLibrary(uri), 'export declare const unicode: "été";');
}));
