import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }] = await loadServerModules(['project/Build.ts']);

function makeBuild() {
    const build = Object.create(Build.prototype);
    build.writeFile = async (path, content) => writeFileSync(path, content);
    return build;
}

const hash = content => createHash('sha256').update(content).digest('hex');

test('a filesystem deletion error restores earlier output writes and deletions, then retry succeeds', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-delete-rollback-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const current = join(root, 'current.js');
    const obsolete = join(root, 'obsolete.js');
    const invalid = join(root, 'directory-instead-of-file');
    writeFileSync(current, 'previous current');
    writeFileSync(obsolete, 'previous obsolete');
    mkdirSync(invalid);
    const build = makeBuild();
    const queue = () => {
        build.pendingOutputs = new Map([[current, 'new current']]);
        build.pendingDeletions = new Map([[obsolete, hash('previous obsolete')], [invalid, hash('anything')]]);
    };

    queue();
    await assert.rejects(build.publishOutputs());
    assert.equal(readFileSync(current, 'utf8'), 'previous current');
    assert.equal(readFileSync(obsolete, 'utf8'), 'previous obsolete');
    assert.equal(existsSync(invalid), true);

    rmSync(invalid, { recursive: true });
    queue();
    await build.publishOutputs();
    assert.equal(readFileSync(current, 'utf8'), 'new current');
    assert.equal(existsSync(obsolete), false);
});

test('a real output path occupied by a directory rolls back an earlier overwrite and later recovers', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-output-directory-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const first = join(root, 'first.js');
    const second = join(root, 'second.js');
    writeFileSync(first, 'first version');
    mkdirSync(second);
    const build = makeBuild();
    const queue = () => {
        build.pendingOutputs = new Map([[first, 'second version'], [second, 'new second']]);
        build.pendingDeletions = new Map();
    };

    queue();
    await assert.rejects(build.publishOutputs());
    assert.equal(readFileSync(first, 'utf8'), 'first version');
    assert.equal(existsSync(second), true);

    rmSync(second, { recursive: true });
    queue();
    await build.publishOutputs();
    assert.equal(readFileSync(first, 'utf8'), 'second version');
    assert.equal(readFileSync(second, 'utf8'), 'new second');
});
