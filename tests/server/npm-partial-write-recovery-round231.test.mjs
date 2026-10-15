import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Build } = await loadServerModule('project/Build.ts');

function result(names) {
    return {
        npm: { Demo: { content: [], imports: {} } },
        npmsrc: Object.fromEntries(names.map(name => [`${name}.js`, {
            names: [`Demo.${name}`], content: [`export const ${name} = '${name}';`],
            imports: {}, forcedDependencies: [], sourceUri: [],
        }])),
    };
}

test('npm publication retries after a partial write and exposes untracked output from the failed attempt', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-partial-retry-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const output = join(root, 'npm');
    const build = Object.create(Build.prototype);
    let failAt = null;
    build.writeFile = async (path, content) => {
        if (path === failAt) throw new Error('simulated write failure');
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const options = { path: [output], packageJson: false, manifest: false };
    const ownership = join(output, '.aventus-npm-generated.json');

    await build.writeBuildNpm(options, result(['Alpha']));
    const baseline = readFileSync(ownership, 'utf8');
    assert.equal(existsSync(join(output, '__src', 'Alpha.js')), true);

    failAt = join(output, 'index.d.ts');
    await assert.rejects(build.writeBuildNpm(options, result(['Beta'])), /simulated write failure/);
    assert.equal(existsSync(join(output, '__src', 'Beta.js')), true);
    assert.equal(readFileSync(ownership, 'utf8'), baseline);

    failAt = null;
    await build.writeBuildNpm(options, result(['Gamma']));
    const current = JSON.parse(readFileSync(ownership, 'utf8'));
    assert.equal(existsSync(join(output, '__src', 'Alpha.js')), false);
    assert.equal(existsSync(join(output, '__src', 'Gamma.js')), true);
    assert.equal(existsSync(join(output, '__src', 'Beta.js')), true);
    assert.equal(Object.hasOwn(current, '__src/Beta.js'), false);
    assert.equal(Object.hasOwn(current, '__src/Gamma.js'), true);
});

test('npm publication to two destinations leaves partial sources in both when the second fails', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-two-destinations-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const first = join(root, 'first');
    const second = join(root, 'second');
    const build = Object.create(Build.prototype);
    let failAt = null;
    build.writeFile = async (path, content) => {
        if (path === failAt) throw new Error('second destination failed');
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const options = { path: [first, second], packageJson: false, manifest: false };
    await build.writeBuildNpm(options, result(['Alpha']));

    failAt = join(second, 'index.d.ts');
    await assert.rejects(build.writeBuildNpm(options, result(['Beta'])), /second destination failed/);
    assert.equal(existsSync(join(first, '__src', 'Beta.js')), true);
    assert.equal(existsSync(join(first, '__src', 'Alpha.js')), true);
    assert.equal(existsSync(join(second, '__src', 'Alpha.js')), true);
    assert.equal(existsSync(join(second, '__src', 'Beta.js')), true);

    failAt = null;
    await build.writeBuildNpm(options, result(['Gamma']));
    assert.equal(existsSync(join(first, '__src', 'Beta.js')), true);
    assert.equal(existsSync(join(second, '__src', 'Alpha.js')), false);
    assert.equal(existsSync(join(first, '__src', 'Gamma.js')), true);
    assert.equal(existsSync(join(second, '__src', 'Gamma.js')), true);
    assert.equal(existsSync(join(second, '__src', 'Beta.js')), true);
});
