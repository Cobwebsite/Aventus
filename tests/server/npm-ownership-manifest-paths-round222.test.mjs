import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Build } = await loadServerModule('project/Build.ts');

test('npm rebuild ignores escaped paths in its ownership manifest while removing a stale generated file', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-manifest-paths-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const output = join(root, 'output');
    const outside = join(root, 'outside.txt');
    const inside = join(output, 'keep.txt');
    const content = 'untouched\n';
    mkdirSync(output);
    writeFileSync(outside, content);
    writeFileSync(inside, content);

    const build = Object.create(Build.prototype);
    build.writeFile = async (path, value) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, value);
    };
    const options = { path: [output], packageJson: false, manifest: false };
    const result = names => ({
        npm: { Demo: { content: [], imports: {} } },
        npmsrc: Object.fromEntries(names.map(name => [
            `${name}.js`, {
                names: [`Demo.${name}`], content: [`export const ${name} = 1;`],
                imports: {}, forcedDependencies: [], sourceUri: [],
            },
        ])),
    });

    await build.writeBuildNpm(options, result(['Alpha', 'Beta']));
    const manifestPath = join(output, '.aventus-npm-generated.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const matchingHash = createHash('sha256').update(content).digest('hex');
    manifest['../outside.txt'] = matchingHash;
    manifest['__src/../../outside.txt'] = matchingHash;
    manifest['/keep.txt'] = matchingHash;
    manifest['__src/../keep.txt'] = matchingHash;
    writeFileSync(manifestPath, JSON.stringify(manifest));

    await build.writeBuildNpm(options, result(['Alpha']));
    assert.equal(existsSync(join(output, '__src', 'Beta.js')), false);
    assert.equal(existsSync(join(output, '__src', 'Alpha.js')), true);
    assert.equal(readFileSync(outside, 'utf8'), content);
    assert.equal(readFileSync(inside, 'utf8'), content);
    const refreshed = JSON.parse(readFileSync(manifestPath, 'utf8'));
    assert.equal(Object.keys(refreshed).some(path => path.includes('..') || path.startsWith('/')), false);
    assert.equal(Object.hasOwn(refreshed, '__src/Beta.js'), false);
    assert.equal(Object.hasOwn(refreshed, '__src/Alpha.js'), true);
});
