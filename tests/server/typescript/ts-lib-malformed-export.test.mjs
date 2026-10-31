import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { loadNodeModules, loadLibrary } = await loadServerModule('language-services/ts/libLoader.ts');

function putPackage(modules, name, manifest, files = {}) {
    const packageDir = join(modules, name);
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify(manifest));
    for (const [relative, contents] of Object.entries(files)) {
        const path = join(packageDir, relative);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, contents);
    }
    return packageDir;
}

test('malformed export path is skipped and rediscovered after package metadata is corrected', t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-malformed-export-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const modules = join(root, 'node_modules');
    putPackage(modules, 'healthy', { types: './index.d.ts' }, {
        'index.d.ts': 'export declare const healthy: true;',
    });
    const broken = putPackage(modules, 'broken', { exports: { '.': 42 } }, {
        'index.d.ts': 'export declare const recovered: true;',
    });

    // A valid JSON manifest can still contain an invalid exports value. The
    // loader catches the path error while retaining declarations from siblings.
    const previousError = console.error;
    const errors = [];
    let firstPaths;
    try {
        console.error = error => errors.push(error);
        firstPaths = loadNodeModules(modules);
    } finally {
        console.error = previousError;
    }
    assert.equal(errors.length, 1);
    assert.equal(errors[0].code, 'ERR_INVALID_ARG_TYPE');
    assert.deepEqual(firstPaths.map(loadLibrary), ['export declare const healthy: true;']);

    writeFileSync(join(broken, 'package.json'), JSON.stringify({ exports: { '.': './index.d.ts' } }));
    const paths = loadNodeModules(modules);
    assert.equal(paths.length, 2);
    assert.deepEqual(paths.map(loadLibrary).sort(), [
        'export declare const healthy: true;',
        'export declare const recovered: true;',
    ]);
});
