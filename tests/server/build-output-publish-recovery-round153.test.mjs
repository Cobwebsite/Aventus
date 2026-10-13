import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts',
]);

test('publishing multiple build outputs rolls back an earlier overwrite after a later write fails, then retries', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-publish-retry-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const first = join(root, 'dist', 'first.js');
    const second = join(root, 'dist', 'second.js');
    mkdirSync(dirname(first), { recursive: true });
    writeFileSync(first, 'previous output');

    const oldServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 0, connection: { sendNotification() {} } };
    t.after(() => { GenericServer.instance = oldServer; });

    const build = Object.create(Build.prototype);
    let failSecond = true;
    build.writeFile = async (path, content) => {
        if (path === second && failSecond) throw new Error('second destination unavailable');
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const queue = () => {
        build.pendingOutputs = new Map([[first, 'updated first'], [second, 'updated second']]);
        build.pendingDeletions = new Map();
    };

    queue();
    await assert.rejects(build.publishOutputs(), /second destination unavailable/);
    assert.equal(readFileSync(first, 'utf8'), 'previous output');
    assert.equal(existsSync(second), false);
    assert.equal(build.pendingOutputs, undefined);

    failSecond = false;
    queue();
    await build.publishOutputs();
    assert.equal(readFileSync(first, 'utf8'), 'updated first');
    assert.equal(readFileSync(second, 'utf8'), 'updated second');
});

test('publishing a rebuild deletes only an unchanged obsolete output while retaining an externally edited one', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-publish-cleanup-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const obsolete = join(root, 'obsolete.js');
    const edited = join(root, 'edited.js');
    const current = join(root, 'current.js');
    writeFileSync(obsolete, 'old\r\ncode');
    writeFileSync(edited, 'edited outside the build');

    const build = Object.create(Build.prototype);
    build.writeFile = async (path, content) => writeFileSync(path, content);
    const hash = content => createHash('sha256').update(content).digest('hex');
    build.pendingOutputs = new Map([[current, 'new code']]);
    build.pendingDeletions = new Map([
        [obsolete, hash('old\ncode')],
        [edited, hash('original generated code')],
    ]);

    await build.publishOutputs();
    assert.equal(readFileSync(current, 'utf8'), 'new code');
    assert.equal(existsSync(obsolete), false);
    assert.equal(readFileSync(edited, 'utf8'), 'edited outside the build');
});
