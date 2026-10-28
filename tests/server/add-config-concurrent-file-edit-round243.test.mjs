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

test('add config section keeps an edit made while the section type is being selected', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-add-config-concurrent-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });

    let releaseSection;
    const notifications = [];
    GenericServer.instance = { connection: {
        Select: () => new Promise(resolve => { releaseSection = resolve; }),
        Input: async () => 'New build',
        sendNotification: (...args) => notifications.push(args),
    } };

    const original = { module: 'Demo', build: [], static: [], custom: { revision: 1 } };
    writeFileSync(path, JSON.stringify(original));
    const pending = Commands.allCommandes['aventus.addConfigSection'].run(uri);
    assert.equal(typeof releaseSection, 'function');

    const revised = {
        module: 'Demo2',
        build: [{ name: 'Existing', src: ['existing.ts'], compile: [] }],
        static: [{ name: 'Assets', input: 'assets', output: 'dist/assets' }],
        custom: { revision: 2 },
    };
    writeFileSync(path, JSON.stringify(revised));
    releaseSection({ label: 'Build' });
    await pending;

    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), {
        ...revised,
        build: [...revised.build, { name: 'New_build', src: [], compile: [{ output: './dist/New-build.js' }] }],
    });
    assert.deepEqual(notifications, [['aventus/openfile', [uri]]]);
});

test('add static section keeps an edit made while its type is being selected', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-add-static-concurrent-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });

    let releaseSelection;
    const notifications = [];
    GenericServer.instance = { connection: {
        Select: () => new Promise(resolve => { releaseSelection = resolve; }),
        Input: async () => 'New assets',
        sendNotification: (...args) => notifications.push(args),
    } };

    const original = { module: 'Demo', build: [], static: [], custom: { revision: 1 } };
    writeFileSync(path, JSON.stringify(original));
    const pending = Commands.allCommandes['aventus.addConfigSection'].run(uri);
    await Promise.resolve();
    assert.equal(typeof releaseSelection, 'function');

    const revised = { ...original, module: 'Demo2', custom: { revision: 2 }, static: [{ name: 'Existing', input: 'old', output: 'old-out' }] };
    writeFileSync(path, JSON.stringify(revised));
    releaseSelection({ label: 'Static' });
    await pending;

    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), {
        ...revised,
        static: [...revised.static, { name: 'New assets', input: '', output: '' }],
    });
    assert.deepEqual(notifications, [['aventus/openfile', [uri]]]);
});
