import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ writeFile }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'tools.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

async function withSettings(root, callback) {
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    GenericServer.instance = { _savePath: root };
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        await callback();
    } finally {
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
    }
}

test('output writer creates parent folders, normalizes newlines and skips identical content', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-output-writer-'));
    const path = join(root, 'nested', 'result.js');
    try { await withSettings(root, async () => {
        await writeFile(path, 'one\r\ntwo\rthree', 'build', 'web');
        assert.equal(readFileSync(path, 'utf8'), 'one\ntwo\nthree');
        const old = new Date('2001-01-01T00:00:00.000Z');
        utimesSync(path, old, old);
        await writeFile(path, 'one\ntwo\nthree', 'build', 'web');
        assert.equal(statSync(path).mtime.getTime(), old.getTime());
    }); } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('output writer currently keeps an externally modified file when generated text is unchanged', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-output-cache-'));
    const path = join(root, 'result.css');
    try { await withSettings(root, async () => {
        await writeFile(path, 'generated', 'static', 'assets');
        writeFileSync(path, 'external edit');
        await writeFile(path, 'generated', 'static', 'assets');
        assert.equal(readFileSync(path, 'utf8'), 'external edit');
    }); } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('output writer releases the per-file mutex after a filesystem failure', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-output-retry-'));
    const parent = join(root, 'blocked');
    const path = join(parent, 'result.js');
    writeFileSync(parent, 'not a folder');
    try { await withSettings(root, async () => {
        await assert.rejects(writeFile(path, 'first', 'build', 'web', 0), error =>
            error.code === 'ENOTDIR' || error.code === 'ENOENT');
        rmSync(parent);
        mkdirSync(parent);
        await writeFile(path, 'recovered', 'build', 'web', 0);
        assert.equal(readFileSync(path, 'utf8'), 'recovered');
    }); } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('concurrent writes to one output finish in submission order', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-output-order-'));
    const path = join(root, 'result.js');
    try { await withSettings(root, async () => {
        await Promise.all([
            writeFile(path, 'first', 'build', 'web'),
            writeFile(path, 'second', 'build', 'web'),
            writeFile(path, 'third', 'build', 'web'),
        ]);
        assert.equal(readFileSync(path, 'utf8'), 'third');
    }); } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
