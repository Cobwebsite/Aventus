import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { SettingsManager }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'settings/Settings.ts', 'tools.ts',
]);

test('readDirs with two wildcard segments discovers only matching directories', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-discovery-globs-'));
    const previousSettings = SettingsManager.instance;
    try {
        const path = join(root, 'src', 'alpha', 'components', 'beta');
        mkdirSync(path, { recursive: true });
        const config = join(path, 'aventus.conf.avt');
        writeFileSync(config, '{}');
        const wrongDepth = join(root, 'src', 'alpha', 'deep', 'components', 'beta');
        mkdirSync(wrongDepth, { recursive: true });
        writeFileSync(join(wrongDepth, 'aventus.conf.avt'), '{}');
        const wrongBranch = join(root, 'src', 'alpha', 'other', 'beta');
        mkdirSync(wrongBranch, { recursive: true });
        writeFileSync(join(wrongBranch, 'aventus.conf.avt'), '{}');
        const manager = Object.create(FilesManager.prototype);
        SettingsManager.instance = { settings: { readDirs: ['src/*'] } };
        const singleWildcard = await manager.loadAllAventusConfigFiles([pathToUri(root)]);
        assert.equal(singleWildcard.length, 3);

        SettingsManager.instance.settings.readDirs = ['src/*/components/*'];
        const multipleWildcards = await manager.loadAllAventusConfigFiles([pathToUri(root)]);
        assert.deepEqual(multipleWildcards.map(file => file.uri), [pathToUri(config)]);
    } finally {
        SettingsManager.instance = previousSettings;
        rmSync(root, { recursive: true, force: true });
    }
});
