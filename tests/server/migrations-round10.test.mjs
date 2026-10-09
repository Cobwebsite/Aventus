import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GenericServer }, update141, { updatesScripts }] = await loadServerModules([
    'GenericServer.ts', 'updates/1.4.1.ts', 'updates/index.ts',
]);

test('migration registry exposes the two historical versions in upgrade order', () => {
    assert.deepEqual(Object.keys(updatesScripts), ['1.4.0', '1.4.1']);
    assert.equal(typeof updatesScripts['1.4.0'], 'function');
    assert.equal(typeof updatesScripts['1.4.1'], 'function');
});

test('1.4.1 migration currently replaces dependency spelling in string values as well as keys', () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-migrate-'));
    const packages = join(root, 'packages');
    mkdirSync(packages);
    const file = join(packages, 'sample.package.avt');
    writeFileSync(file, JSON.stringify({ dependances: ['library'], description: 'dependances are listed here' }));
    const previous = GenericServer.instance;
    GenericServer.instance = { _savePath: root };
    try {
        update141.run();
        const result = JSON.parse(readFileSync(file, 'utf8'));
        assert.deepEqual(result.dependencies, ['library']);
        assert.equal(result.description, 'dependencies are listed here');
    } finally {
        GenericServer.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
