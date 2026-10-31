import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { GenericServer }] = await loadServerModules(['cmds/index.ts', 'GenericServer.ts']);

test('add config leaves a deleted file absent during input and succeeds after restoration', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-add-config-deleted-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const config = { module: 'Demo', build: [], static: [] };
    writeFileSync(path, JSON.stringify(config));

    const previousServer = GenericServer.instance;
    const previousError = console.error;
    t.after(() => { GenericServer.instance = previousServer; console.error = previousError; });
    let releaseName;
    const notifications = [];
    const logged = [];
    console.error = error => logged.push(error);
    GenericServer.instance = { connection: {
        Select: async () => ({ label: 'Build' }),
        Input: () => new Promise(resolve => { releaseName = resolve; }),
        sendNotification: (...args) => notifications.push(args),
    } };

    const add = () => Commands.allCommandes['aventus.addConfigSection'].run(uri);
    const pending = add();
    await Promise.resolve();
    assert.equal(typeof releaseName, 'function');
    unlinkSync(path);
    releaseName('First');
    await pending;
    assert.equal(existsSync(path), false);
    assert.deepEqual(notifications, []);
    assert.equal(logged.length, 1);
    assert.equal(logged[0].code, 'ENOENT');

    writeFileSync(path, JSON.stringify(config));
    const retry = add();
    await Promise.resolve();
    releaseName('Second');
    await retry;
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), {
        ...config,
        build: [{ name: 'Second', src: [], compile: [{ output: './dist/Second.js' }] }],
    });
    assert.deepEqual(notifications, [['aventus/openfile', [uri]]]);
});
