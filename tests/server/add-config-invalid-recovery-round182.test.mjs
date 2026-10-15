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

test('add config section preserves invalid file, then succeeds after repair on the same command', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-add-config-recovery-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, 'aventus.conf.avt');
    const uri = pathToFileURL(path).href;
    const invalid = '{"module":"Demo","build":[';
    writeFileSync(path, invalid);

    const previousServer = GenericServer.instance;
    const previousError = console.error;
    t.after(() => {
        GenericServer.instance = previousServer;
        console.error = previousError;
    });
    const prompts = [];
    const notifications = [];
    const errors = [];
    GenericServer.instance = { connection: {
        Select: async (_items, options) => {
            prompts.push(options.title);
            return { label: 'Build' };
        },
        Input: async () => {
            prompts.push('build name');
            return 'Recovered Build';
        },
        sendNotification: (...args) => notifications.push(args),
    } };
    console.error = error => errors.push(error);

    await Commands.allCommandes['aventus.addConfigSection'].run(uri);
    assert.equal(readFileSync(path, 'utf8'), invalid);
    assert.equal(errors.length, 1);
    assert.ok(errors[0] instanceof SyntaxError);
    assert.deepEqual(notifications, []);

    writeFileSync(path, JSON.stringify({ module: 'Demo', build: [], static: [] }));
    await Commands.allCommandes['aventus.addConfigSection'].run(uri);
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), {
        module: 'Demo', static: [],
        build: [{ name: 'Recovered_Build', src: [], compile: [{ output: './dist/Recovered-Build.js' }] }],
    });
    assert.deepEqual(prompts, ['Section type', 'Section type', 'build name']);
    assert.deepEqual(notifications, [['aventus/openfile', [uri]]]);
});
