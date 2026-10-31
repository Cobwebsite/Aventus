import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModule } from '../helpers/load-ts.mjs';

const { loadNodeModules, loadLibrary } = await loadServerModule('language-services/ts/libLoader.ts');

test('conditional npm declarations follow export edits, missing files and recovery', t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-lib-conditional-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const modules = join(root, 'node_modules');
    const packageDir = join(modules, 'conditional');
    mkdirSync(packageDir, { recursive: true });
    const manifest = join(packageDir, 'package.json');
    const js = join(packageDir, 'index.js');
    const declaration = join(packageDir, 'index.d.ts');
    const saveManifest = exports => writeFileSync(manifest, JSON.stringify({ exports: { '.': exports } }));
    const loaded = () => loadNodeModules(modules).map(loadLibrary);

    writeFileSync(js, 'exports.value = 1;');
    writeFileSync(declaration, 'export declare const value: 1;');
    saveManifest({ node: './index.js', types: './index.d.ts' });
    assert.deepEqual(loaded(), ['export declare const value: 1;']);

    unlinkSync(declaration);
    assert.deepEqual(loaded(), ['exports.value = 1;']);
    writeFileSync(declaration, 'export declare const value: 1;');

    saveManifest({ types: './index.d.ts' });
    assert.deepEqual(loaded(), ['export declare const value: 1;']);

    unlinkSync(declaration);
    assert.deepEqual(loadNodeModules(modules), []);
    writeFileSync(declaration, 'export declare const value: 2;');
    assert.deepEqual(loaded(), ['export declare const value: 2;']);

    saveManifest({ types: './missing.d.ts', default: './index.js' });
    assert.deepEqual(loaded(), ['exports.value = 1;']);
    saveManifest({ types: './index.d.ts', default: './index.js' });
    assert.deepEqual(loaded(), ['export declare const value: 2;']);
});
