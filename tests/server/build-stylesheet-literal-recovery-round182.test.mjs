import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { Script, runInNewContext } from 'node:vm';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }] = await loadServerModules(['project/Build.ts']);

test('stylesheet literals in JS output follow invalid, repaired and removed revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-style-literal-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const output = join(root, 'main.js');
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    build.buildConfig = { fullname: 'Demo@web', module: 'Demo' };
    build.npmBuilder = { compile: async () => ({ result: '', errors: [] }) };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const write = async (revision, stylesheets) => {
        await build.writeBuildCode({
            codeNoNamespaceBefore: [], code: [`globalThis.Revision = ${revision};`],
            classesName: {}, codeNoNamespaceAfter: [], stylesheets, useDecorator: false,
        }, [], [{ '@default': { path: output } }]);
        return readFileSync(output, 'utf8');
    };

    // A backtick is legal inside a CSS string, but the generated JS embeds it
    // without escaping the surrounding template literal.
    const broken = await write(1, { '@label': '.label::after { content: "`"; }' });
    assert.match(broken, /Style\.store\("@label"/);
    assert.throws(() => new Script(broken), SyntaxError);

    const repaired = await write(2, { '@label': '.label::after { content: "ok"; }' });
    const stores = [];
    runInNewContext(repaired, {
        Aventus: { Style: { store: (name, css) => stores.push([name, css]) } },
    });
    assert.deepEqual(stores, [['@label', '.label::after { content: "ok"; }']]);
    assert.doesNotMatch(repaired, /Revision = 1|content: "`"/);

    const removed = await write(3, {});
    assert.doesNotMatch(removed, /Style\.store|Revision = [12]/);
    assert.doesNotThrow(() => new Script(removed));
});
