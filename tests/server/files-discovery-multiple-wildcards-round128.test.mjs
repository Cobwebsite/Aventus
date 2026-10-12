import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ FilesManager }, { SettingsManager }, { pathToUri }] = await loadServerModules([
    'files/FilesManager.ts', 'settings/Settings.ts', 'tools.ts',
]);

test('readDirs with two wildcard segments skips matching configuration files', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-discovery-globs-'));
    const previousSettings = SettingsManager.instance;
    try {
        const path = join(root, 'src', 'alpha', 'components', 'beta');
        mkdirSync(path, { recursive: true });
        const config = join(path, 'aventus.conf.avt');
        writeFileSync(config, '{}');
        const manager = Object.create(FilesManager.prototype);
        SettingsManager.instance = { settings: { readDirs: ['src/*'] } };
        const singleWildcard = await manager.loadAllAventusConfigFiles([pathToUri(root)]);
        assert.deepEqual(singleWildcard.map(file => file.uri), [pathToUri(config)]);

        SettingsManager.instance.settings.readDirs = ['src/*/components/*'];
        const multipleWildcards = await manager.loadAllAventusConfigFiles([pathToUri(root)]);
        assert.deepEqual(multipleWildcards, []);
    } finally {
        SettingsManager.instance = previousSettings;
        rmSync(root, { recursive: true, force: true });
    }
});
