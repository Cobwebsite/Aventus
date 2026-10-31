import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }] = await loadServerModules(['project/Build.ts']);

test('two JS output groups recover after a later destination rejects one revision', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-multi-output-retry-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const first = join(root, 'first', 'main.js');
    const second = join(root, 'second', 'main.js');
    const build = Object.create(Build.prototype);
    build.publishedJsOutputs = new Map();
    build.buildRevision = 0;
    build.buildConfig = { fullname: 'Demo@web', module: 'Demo' };
    let npmRevision = 0;
    build.npmBuilder = { compile: async () => ({ result: `globalThis.NpmRevision = ${npmRevision};\n`, errors: [] }) };
    let rejectSecond = false;
    build.writeFile = async (path, content) => {
        if (path === second && rejectSecond) throw new Error('second output unavailable');
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const outputs = [
        { '@default': { path: first } },
        { '@default': { path: second } },
    ];
    const write = async revision => {
        npmRevision = revision;
        return build.writeBuildCode({
            codeNoNamespaceBefore: [], code: [`globalThis.CodeRevision = ${revision};`],
            classesName: {}, codeNoNamespaceAfter: [], stylesheets: {}, useDecorator: false,
        }, [], outputs);
    };

    await write(1);
    assert.match(readFileSync(first, 'utf8'), /CodeRevision = 1/);
    assert.equal(readFileSync(first, 'utf8'), readFileSync(second, 'utf8'));

    rejectSecond = true;
    await assert.rejects(write(2), /second output unavailable/);
    assert.match(readFileSync(first, 'utf8'), /CodeRevision = 2/);
    assert.match(readFileSync(second, 'utf8'), /CodeRevision = 1/);

    rejectSecond = false;
    await write(3);
    const repaired = readFileSync(first, 'utf8');
    assert.equal(repaired, readFileSync(second, 'utf8'));
    assert.match(repaired, /CodeRevision = 3/);
    assert.match(repaired, /NpmRevision = 3/);
    assert.doesNotMatch(repaired, /Revision = [12]/);
});
