import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Build } = await loadServerModule('project/Build.ts');

test('npm output can be retried after a source write fails', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.npm-write-round147-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const output = join(root, 'dist');
    const build = Object.create(Build.prototype);
    build.buildConfig = { fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0' };
    build.project = { getConfigFile: () => ({ folderPath: root }) };
    build.tsFiles = {};
    build.externalPackageInformation = { filesUri: [] };
    let failOnce = true;
    build.writeFile = async (path, content) => {
        if (failOnce && path.endsWith('widget.ts')) {
            failOnce = false;
            throw new Error('write failed');
        }
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const options = { path: [output], packageJson: false, manifest: false };
    const result = {
        npm: {},
        npmsrc: { 'widget.ts': {
            names: ['Widget'], content: ['export class Widget {}'], imports: {},
            forcedDependencies: [], sourceUri: [],
        } },
    };

    await assert.rejects(build.writeBuildNpm(options, result), /write failed/);
    await build.writeBuildNpm(options, result);
    assert.match(readFileSync(join(output, '__src', 'widget.ts'), 'utf8'), /export class Widget/);
    assert.match(readFileSync(join(output, 'index.js'), 'utf8'), /Widget/);
    assert.equal(existsSync(join(output, '.aventus-npm-generated.json')), true);
});
