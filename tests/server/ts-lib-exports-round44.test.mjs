import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { version } from 'typescript';
import { loadServerModule } from './helpers/load-ts.mjs';

const { loadNodeModules, loadLibrary } = await loadServerModule('language-services/ts/libLoader.ts');

function withModules(run) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-lib-exports-'));
    const modules = join(root, 'node_modules');
    mkdirSync(modules);
    try { return run(modules); }
    finally { rmSync(root, { recursive: true, force: true }); }
}

function putPackage(modules, name, manifest, files) {
    const folder = join(modules, name);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'package.json'), JSON.stringify(manifest));
    for (const [relative, content] of Object.entries(files)) {
        const file = join(folder, relative);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, content);
    }
}

test('npm library loader selects a matching TypeScript version condition and falls back for a nonmatching one', () => withModules(modules => {
    putPackage(modules, 'matching', { exports: { '.': {
        [`types@${version}`]: './current.d.ts', types: './fallback.d.ts',
    } } }, {
        'current.d.ts': 'export declare const chosen: 1;',
        'fallback.d.ts': 'export declare const chosen: 2;',
    });
    putPackage(modules, 'unmatched', { exports: { '.': {
        'types@0.0.0': './old.d.ts', types: './fallback.d.ts',
    } } }, {
        'old.d.ts': 'export declare const selected: 0;',
        'fallback.d.ts': 'export declare const selected: 2;',
    });

    const libraries = loadNodeModules(modules).map(loadLibrary);
    assert.equal(libraries.length, 2);
    assert.ok(libraries.includes('export declare const chosen: 1;'));
    assert.ok(libraries.includes('export declare const selected: 2;'));
}));

test('npm library loader deduplicates repeated export paths and limits TypeScript preference to each package', () => withModules(modules => {
    putPackage(modules, 'typed', {
        main: './index.js', types: './index.d.ts',
        exports: { '.': ['./index.d.ts', './index.d.ts'] },
    }, {
        'index.js': 'exports.value = 1;',
        'index.d.ts': 'export declare const value: number;',
    });
    putPackage(modules, 'plain', { main: './index.js' }, {
        'index.js': 'exports.plain = true;',
    });

    const libraries = loadNodeModules(modules).map(loadLibrary);
    assert.deepEqual(libraries.sort(), [
        'export declare const value: number;',
        'exports.plain = true;',
    ].sort());
}));
