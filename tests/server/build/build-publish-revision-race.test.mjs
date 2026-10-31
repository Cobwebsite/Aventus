import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules(['project/Build.ts', 'GenericServer.ts']);

test('a superseding revision during the second output rolls back both writes before a later publication', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-revision-publish-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const first = join(root, 'first.js');
    const second = join(root, 'second.js');
    writeFileSync(second, 'old second');

    const previousServer = GenericServer.instance;
    GenericServer.instance = { _noBuild: false };
    t.after(() => { GenericServer.instance = previousServer; });

    const build = Object.create(Build.prototype);
    build.buildRevision = 1;
    let releaseSecond;
    let signalSecond;
    const secondStarted = new Promise(resolve => { signalSecond = resolve; });
    build.writeFile = async (path, content) => {
        writeFileSync(path, content);
        if (path === second && content === 'revision one second') {
            signalSecond();
            await new Promise(resolve => { releaseSecond = resolve; });
        }
    };
    const queue = (revision) => {
        build.pendingOutputs = new Map([
            [first, `revision ${revision} first`],
            [second, `revision ${revision} second`],
        ]);
        build.pendingDeletions = new Map();
    };

    queue('one');
    const publishing = build.publishOutputs(1);
    await secondStarted;
    build.buildRevision = 2;
    releaseSecond();
    await assert.rejects(publishing);
    assert.equal(existsSync(first), false);
    assert.equal(readFileSync(second, 'utf8'), 'old second');
    assert.equal(build.pendingOutputs, undefined);

    queue('two');
    await build.publishOutputs(2);
    assert.equal(readFileSync(first, 'utf8'), 'revision two first');
    assert.equal(readFileSync(second, 'utf8'), 'revision two second');
});
