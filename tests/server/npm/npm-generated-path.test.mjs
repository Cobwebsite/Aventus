import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules(['project/Build.ts', 'GenericServer.ts']);

test('npm output rejects a generated source outside its destination and can rebuild afterward', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-npm-path-'));
    const previousServer = GenericServer.instance;
    GenericServer.instance = { ...(previousServer ?? {}), workspaces: [pathToFileURL(root).href] };
    t.after(() => { GenericServer.instance = previousServer; });
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const output = join(root, 'output');
    const outside = join(root, 'escaped.js');
    const build = Object.create(Build.prototype);
    build.project = { getConfigFile: () => ({ folderPath: root }) };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const source = value => ({ names: ['Demo.Safe'], content: [`export const Safe = ${value};`],
        imports: {}, forcedDependencies: [], sourceUri: [] });
    const options = { path: [output], packageJson: false, manifest: false };
    await assert.rejects(build.writeBuildNpm(options, {
        npm: { Demo: { content: [], imports: {} } }, npmsrc: { '../../escaped.js': source('1') },
    }), /outside its destination/);
    assert.equal(existsSync(outside), false);

    await build.writeBuildNpm(options, {
        npm: { Demo: { content: [], imports: {} } }, npmsrc: { 'safe.js': source('2') },
    });
    assert.match(readFileSync(join(output, '__src', 'safe.js'), 'utf8'), /Safe = 2/);
    assert.match(readFileSync(join(output, 'Demo', 'index.js'), 'utf8'), /Safe/);
    assert.equal(existsSync(outside), false);
});
