import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts',
]);

test('a pending delayed build writes its output after global noBuild is enabled', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-pending-no-build-'));
    const output = join(root, 'main.js');
    const prior = GenericServer.instance;
    const notifications = [];
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 99,
        connection: {
            delayBetweenBuild: () => 30,
            sendNotification: (name, args) => notifications.push([name, args]),
        },
    };
    const build = Object.create(Build.prototype);
    t.after(() => {
        clearTimeout(build.timerBuild);
        GenericServer.instance = prior;
        rmSync(root, { recursive: true, force: true });
    });
    Object.assign(build, {
        initDone: true, _allowBuild: true, diagnostics: new Map(),
        buildConfig: {
            fullname: 'Demo@pending', module: 'Demo',
            compile: [{ output: [{ '@default': { path: output } }], package: [],
                outputNpm: { live: false } }],
        },
        npmBuilder: { compile: async () => ({ result: '', errors: [] }) },
    });
    build.buildOrderCompilationInfo = async () => ({ toCompile: [], libSrc: [], errors: [] });
    build.buildLocalCode = async () => ({
        codeNoNamespaceBefore: [], code: ['class Pending {}'], classesName: {},
        codeNoNamespaceAfter: [], stylesheets: {}, useDecorator: false,
        codeRenderInJs: [], codeNotRenderInJs: [],
    });
    build.writeBuildDocumentation = async () => {};
    build.writeFile = async (path, content) => writeFileSync(path, content);

    await build.build();
    assert.equal(existsSync(output), false);
    GenericServer.instance._noBuild = true;
    await build.build();
    assert.equal(existsSync(output), false);
    await new Promise(resolve => setTimeout(resolve, 80));
    assert.match(readFileSync(output, 'utf8'), /class Pending/);
    assert.deepEqual(notifications.filter(([name]) => name === 'aventus/compiled'), [
        ['aventus/compiled', ['Demo@pending', []]],
    ]);
});
