import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Commands }, { GenericServer }] = await loadServerModules(['cmds/index.ts', 'GenericServer.ts']);

test('static section keeps the exact user name and appends without changing existing builds', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-name-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const originalBuild = { name: 'App', src: ['src'], compile: [{ output: './dist/app.js' }] };
    writeFileSync(path, JSON.stringify({ module: 'Demo', build: [originalBuild], static: [{ name: 'Images', input: 'assets', output: 'dist/assets' }] }));
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    const prompts = [];
    const notifications = [];
    GenericServer.instance = { connection: {
        Select: async (_items, options) => { prompts.push(options.title); return { label: 'Static' }; },
        Input: async options => { prompts.push(options.title); return '  Café / images  '; },
        sendNotification: (...args) => notifications.push(args),
    } };

    await Commands.allCommandes['aventus.addConfigSection'].run(uri);

    const config = JSON.parse(readFileSync(path, 'utf8'));
    assert.deepEqual(config.build, [originalBuild]);
    assert.deepEqual(config.static, [
        { name: 'Images', input: 'assets', output: 'dist/assets' },
        { name: '  Café / images  ', input: '', output: '' },
    ]);
    assert.deepEqual(prompts, ['Section type', 'Provide a name for your static section (optional)']);
    assert.deepEqual(notifications, [['aventus/openfile', [uri]]]);
});
