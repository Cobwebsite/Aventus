import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadServerModules } from './helpers/load-ts.mjs';

const [serverModule, update140, update141] = await loadServerModules([
    'GenericServer.ts', 'updates/1.4.0.ts', 'updates/1.4.1.ts',
]);
const { GenericServer } = serverModule;

function withSavePath(run) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-migrations-'));
    const previous = GenericServer.instance;
    GenericServer.instance = { _savePath: root };
    try { run(root); } finally {
        GenericServer.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
}

test('1.4.0 migration clears saved folders but preserves root files on repeated runs', () => {
    withSavePath(root => {
        mkdirSync(join(root, 'cache'));
        writeFileSync(join(root, 'cache', 'stale.txt'), 'stale');
        writeFileSync(join(root, 'settings.json'), '{}');
        update140.run();
        update140.run();
        assert.equal(readFileSync(join(root, 'settings.json'), 'utf8'), '{}');
        assert.throws(() => readFileSync(join(root, 'cache', 'stale.txt')));
    });
});

test('1.4.1 migration renames dependency keys recursively and is idempotent', () => {
    withSavePath(root => {
        const nested = join(root, 'packages', 'vendor');
        mkdirSync(nested, { recursive: true });
        const avt = join(nested, 'library.package.avt');
        const untouched = join(nested, 'notes.txt');
        writeFileSync(avt, '{"dependances":[],"name":"library"}');
        writeFileSync(untouched, 'dependances');
        update141.run();
        update141.run();
        assert.equal(readFileSync(avt, 'utf8'), '{"dependencies":[],"name":"library"}');
        assert.equal(readFileSync(untouched, 'utf8'), 'dependances');
    });
});

test('1.4.1 migration accepts an absent packages directory', () => {
    withSavePath(() => assert.doesNotThrow(() => update141.run()));
});
