import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { DebugFileAdd }] = await loadServerModules(['project/Build.ts', 'GenericServer.ts', 'notification/DebugFileAdd.ts']);

test('a routed library minifier error leaves the other outputs current and the next revision repairs all three', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-routed-minifier-retry-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const main = join(root, 'main.js');
    const library = join(root, 'library.js');
    const npm = join(root, 'npm.js');
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    build.buildConfig = { fullname: 'Demo@web', module: 'Demo' };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    let revision = 1;
    build.npmBuilder = { compile: async () => ({ result: `globalThis.NpmRevision = ${revision};`, errors: [] }) };
    const previousError = GenericServer.error;
    const previousDebugSend = DebugFileAdd.send;
    const errors = [];
    const debugFiles = [];
    GenericServer.error = error => errors.push(error);
    DebugFileAdd.send = (uri, content) => debugFiles.push({ uri, content });
    t.after(() => { GenericServer.error = previousError; DebugFileAdd.send = previousDebugSend; });
    const outputs = [{
        '@default': { path: main, compressed: true },
        Vendor: { path: library, compressed: true },
        '@npm': { path: npm, compressed: true },
    }];
    const write = vendorCode => build.writeBuildCode({
        codeNoNamespaceBefore: [], code: [`globalThis.CodeRevision = ${revision};`],
        classesName: {}, codeNoNamespaceAfter: [], stylesheets: {}, useDecorator: false,
    }, [{ lib: 'Vendor', code: vendorCode }], outputs);

    assert.deepEqual(await write('const =;'), [{ file: 'Demo@web_minificationErrors', title: 'Minification errors' }]);
    assert.equal(errors.length, 1);
    assert.equal(existsSync(library), false);
    assert.equal(debugFiles.length, 1);
    assert.match(debugFiles[0].content, /library\.js/);
    assert.match(readFileSync(main, 'utf8'), /CodeRevision=1/);
    assert.match(readFileSync(npm, 'utf8'), /NpmRevision=1/);

    revision = 2;
    assert.deepEqual(await write('globalThis.VendorRevision = 2;'), []);
    assert.equal(errors.length, 1);
    for (const path of [main, library, npm]) {
        const content = readFileSync(path, 'utf8');
        assert.doesNotMatch(content, /const =;|Revision=1/);
        assert.match(content, /Revision=2/);
    }
    assert.doesNotMatch(readFileSync(main, 'utf8'), /VendorRevision|NpmRevision/);
    assert.doesNotMatch(readFileSync(library, 'utf8'), /CodeRevision|NpmRevision/);
    assert.doesNotMatch(readFileSync(npm, 'utf8'), /CodeRevision|VendorRevision/);
});
