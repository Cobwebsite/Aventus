import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'GenericServer.ts',
]);

test('la section statique supprimée pendant le choix du type est recréée sur la configuration récente', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-removed-race-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    writeFileSync(path, JSON.stringify({
        module: 'Demo', build: [], static: [{ name: 'Old', input: 'old', output: 'dist/old' }],
    }));
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    let releaseSelection;
    const notifications = [];
    GenericServer.instance = { connection: {
        Select: () => new Promise(resolve => { releaseSelection = resolve; }),
        Input: async () => 'New assets',
        sendNotification: (...args) => notifications.push(args),
    } };

    const pending = Commands.allCommandes['aventus.addConfigSection'].run(uri);
    await Promise.resolve();
    assert.equal(typeof releaseSelection, 'function');
    const revised = { module: 'Revised', build: [], custom: { version: 2 } };
    writeFileSync(path, JSON.stringify(revised));
    releaseSelection({ label: 'Static' });
    await pending;

    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), {
        ...revised,
        static: [{ name: 'New assets', input: '', output: '' }],
    });
    assert.deepEqual(notifications, [['aventus/openfile', [uri]]]);
});
