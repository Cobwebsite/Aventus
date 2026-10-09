import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Build } = await loadServerModule('project/Build.ts');

function fixture(t) {
    const root = mkdtempSync(join(import.meta.dirname, '.build-npm-round26-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const outputs = [join(root, 'one'), join(root, 'two')];
    const build = Object.create(Build.prototype);
    build.buildConfig = {
        fullname: 'Demo@web', module: 'Demo', name: 'web', version: '2.3.4', organization: 'Example Org',
    };
    build.project = { getConfigFile: () => ({ folderPath: root }) };
    build.tsFiles = {};
    build.externalPackageInformation = {
        filesUri: ['self', 'known', 'fallback'],
        getByUri: uri => ({
            self: { name: 'Demo@web', npmUri: '@demo/web', versionTxt: '2.3.4' },
            known: { name: 'Known', npmUri: '@vendor/known', versionTxt: '1.2.3' },
            fallback: { name: 'Fallback', npmUri: 'fallback', versionTxt: '4.5.6' },
        })[uri],
    };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    return { root, outputs, build };
}

test('npm package metadata merges existing output metadata and resolves external dependencies for both outputs', async t => {
    const { root, outputs, build } = fixture(t);
    writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: { '@vendor/known': '~1.9.0' } }));
    for (const output of outputs) {
        mkdirSync(output);
        writeFileSync(join(output, 'package.json'), JSON.stringify({
            name: 'old', version: '0.0.0', displayName: 'old', private: true,
            scripts: { verify: 'node check.js' },
        }));
    }

    await build.writeBuildNpm({ path: outputs, packageJson: true, npmName: '@custom/widget', manifest: false },
        { npm: {}, npmsrc: {} });

    for (const output of outputs) {
        const metadata = JSON.parse(readFileSync(join(output, 'package.json'), 'utf8'));
        assert.equal(metadata.name, '@custom/widget');
        assert.equal(metadata.version, '2.3.4');
        assert.equal(metadata.displayName, 'Demo web');
        assert.deepEqual(metadata.author, { name: 'Example Org' });
        assert.deepEqual(metadata.dependencies, { '@vendor/known': '~1.9.0', fallback: '^4.5.6' });
        assert.equal(metadata.private, true);
        assert.deepEqual(metadata.scripts, { verify: 'node check.js' });
        assert.equal(metadata.type, 'module');
        assert.equal(metadata.main, 'index.js');
    }
});

test('npm output writes nested source and namespace entry points to every destination', async t => {
    const { outputs, build } = fixture(t);
    build.externalPackageInformation.filesUri = [];
    await build.writeBuildNpm({ path: outputs, packageJson: false, manifest: false }, {
        npm: {
            '': { content: [], imports: {} },
            'Demo': { content: ['export interface Root {}'], imports: {} },
            'Demo.UI': { content: ['export interface Group {}'], imports: {} },
        },
        npmsrc: {
            'components/button.ts': {
                names: ['Demo.UI.Button'], content: ['export class Button {}'], imports: {},
                forcedDependencies: [], sourceUri: [],
            },
        },
    });

    for (const output of outputs) {
        assert.match(readFileSync(join(output, '__src', 'components', 'button.ts'), 'utf8'), /export class Button/);
        assert.match(readFileSync(join(output, 'Demo', 'UI', 'index.js'), 'utf8'), /export \{ Button \} from/);
        assert.match(readFileSync(join(output, 'Demo', 'index.js'), 'utf8'), /export \{ UI \}/);
        assert.match(readFileSync(join(output, 'index.js'), 'utf8'), /export \{ Demo \}/);
        assert.match(readFileSync(join(output, 'Demo', 'UI', 'index.d.ts'), 'utf8'), /interface Group/);
    }
});

test('npm rebuild keeps a removed source file in the previous output', async t => {
    const { outputs, build } = fixture(t);
    const options = { path: outputs, packageJson: false, manifest: false };
    await build.writeBuildNpm(options, {
        npm: { '': { content: [], imports: {} } },
        npmsrc: { 'obsolete.ts': {
            names: ['Obsolete'], content: ['export class Obsolete {}'], imports: {},
            forcedDependencies: [], sourceUri: [],
        } },
    });
    await build.writeBuildNpm(options, { npm: { '': { content: [], imports: {} } }, npmsrc: {} });

    for (const output of outputs) {
        assert.equal(existsSync(join(output, '__src', 'obsolete.ts')), true);
        assert.doesNotMatch(readFileSync(join(output, 'index.js'), 'utf8'), /Obsolete/);
    }
});
