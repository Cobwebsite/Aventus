import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { InitStep }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'notification/InitStep.ts', 'tools.ts',
]);

test('CLI discovery selects the first config across workspaces and forwards build filters', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-cli-discovery-'));
    const first = join(root, 'first');
    const second = join(root, 'second');
    const hidden = join(first, 'node_modules');
    const nested = join(first, 'src');
    mkdirSync(hidden, { recursive: true });
    mkdirSync(nested, { recursive: true });
    mkdirSync(second, { recursive: true });
    writeFileSync(join(hidden, 'aventus.conf.avt'), '{}');
    writeFileSync(join(nested, 'aventus.conf.avt'), '{"module":"first"}');
    writeFileSync(join(second, 'aventus.conf.avt'), '{"module":"second"}');
    const manager = Object.create(FilesManager.prototype);
    const calls = [];
    manager.loadConfigFile = async (...args) => calls.push(args);
    try {
        await manager.loadConfigFileNotSet([pathToUri(first), pathToUri(second)], ['build-a'], ['static-b']);
        assert.deepEqual(calls, [[pathToUri(join(nested, 'aventus.conf.avt')), ['build-a'], ['static-b']]]);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('CLI discovery signals completed initialization when no config exists', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-cli-no-config-'));
    const previous = InitStep.sendDone;
    const calls = [];
    InitStep.sendDone = () => calls.push('done');
    try {
        const manager = Object.create(FilesManager.prototype);
        manager.loadConfigFile = async () => assert.fail('no config should be loaded');
        await manager.loadConfigFileNotSet([pathToUri(root)]);
        assert.deepEqual(calls, ['done']);
    } finally {
        InitStep.sendDone = previous;
        rmSync(root, { recursive: true, force: true });
    }
});

test('CLI discovery searches later workspaces when earlier roots contain only dependencies', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-cli-next-root-'));
    const first = join(root, 'first');
    const second = join(root, 'second');
    mkdirSync(join(first, 'node_modules'), { recursive: true });
    mkdirSync(second, { recursive: true });
    writeFileSync(join(first, 'node_modules', 'aventus.conf.avt'), '{}');
    writeFileSync(join(second, 'aventus.conf.avt'), '{}');
    const calls = [];
    const manager = Object.create(FilesManager.prototype);
    manager.loadConfigFile = async uri => calls.push(uri);
    try {
        await manager.loadConfigFileNotSet([pathToUri(first), pathToUri(second)]);
        assert.deepEqual(calls, [pathToUri(join(second, 'aventus.conf.avt'))]);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
