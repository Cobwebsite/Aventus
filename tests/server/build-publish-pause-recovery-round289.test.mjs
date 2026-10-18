import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules(['project/Build.ts', 'GenericServer.ts']);

test('pausing builds during the first output restores it and a later publication writes both outputs', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-publish-pause-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const first = join(root, 'first.js');
    const second = join(root, 'second.js');
    writeFileSync(first, 'old first');

    const previousServer = GenericServer.instance;
    GenericServer.instance = { _noBuild: false };
    t.after(() => { GenericServer.instance = previousServer; });

    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    let releaseFirst;
    let holdFirst = true;
    const firstWritten = new Promise(resolve => {
        build.writeFile = async (path, content) => {
            writeFileSync(path, content);
            if (path === first && content === 'new first' && holdFirst) await new Promise(done => {
                holdFirst = false;
                releaseFirst = done;
                resolve();
            });
        };
    });
    const queue = () => {
        build.pendingOutputs = new Map([[first, 'new first'], [second, 'new second']]);
        build.pendingDeletions = new Map();
    };

    queue();
    const publishing = build.publishOutputs(0);
    await firstWritten;
    GenericServer.instance._noBuild = true;
    releaseFirst();
    await assert.rejects(publishing);
    assert.equal(readFileSync(first, 'utf8'), 'old first');
    assert.equal(existsSync(second), false);

    GenericServer.instance._noBuild = false;
    queue();
    await build.publishOutputs(0);
    assert.equal(readFileSync(first, 'utf8'), 'new first');
    assert.equal(readFileSync(second, 'utf8'), 'new second');
});
