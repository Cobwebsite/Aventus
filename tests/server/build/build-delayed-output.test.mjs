import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts',
]);

test('delayed full build coalesces revisions, skips a disabled timer, then writes the latest revision', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-delayed-build-round94-'));
    const output = join(root, 'main.js');
    const previous = GenericServer.instance;
    const notifications = [];
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 4,
        connection: {
            delayBetweenBuild: () => 25,
            sendNotification: (name, args) => notifications.push([name, args]),
        },
    };
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    t.after(() => {
        clearTimeout(build.timerBuild);
        GenericServer.instance = previous;
        rmSync(root, { recursive: true, force: true });
    });
    build.initDone = true;
    build._allowBuild = true;
    build.diagnostics = new Map();
    build.buildConfig = {
        fullname: 'Demo@delayed', module: 'Demo',
        compile: [{
            output: [{ '@default': { path: output } }], package: [],
            outputNpm: { live: false },
        }],
    };
    build.npmBuilder = { compile: async () => ({ result: '', errors: [] }), rebuildInfo() {} };
    build.buildOrderCompilationInfo = async () => ({ toCompile: [], libSrc: [], errors: [] });
    build.writeBuildDocumentation = async () => {};
    build.writeFile = async (path, content) => writeFileSync(path, content);
    let revision = 'One';
    let compilations = 0;
    build.buildLocalCode = async () => {
        compilations++;
        return {
            codeNoNamespaceBefore: [], code: [`class ${revision} {}`],
            classesName: {}, codeNoNamespaceAfter: [], stylesheets: {}, useDecorator: false,
            codeRenderInJs: [], codeNotRenderInJs: [],
        };
    };

    await build.build();
    revision = 'Two';
    await build.build();
    await new Promise(resolve => setTimeout(resolve, 65));
    assert.equal(compilations, 1);
    assert.match(readFileSync(output, 'utf8'), /class Two/);
    assert.doesNotMatch(readFileSync(output, 'utf8'), /class One/);

    revision = 'Disabled';
    await build.build();
    build.disableBuild();
    await new Promise(resolve => setTimeout(resolve, 65));
    assert.equal(compilations, 1);
    assert.doesNotMatch(readFileSync(output, 'utf8'), /Disabled/);

    build.enableBuild();
    revision = 'Final';
    await build.build();
    await new Promise(resolve => setTimeout(resolve, 65));
    assert.equal(compilations, 2);
    assert.match(readFileSync(output, 'utf8'), /class Final/);
    assert.doesNotMatch(readFileSync(output, 'utf8'), /class Two|class Disabled/);
    assert.equal(existsSync(output), true);
    assert.deepEqual(notifications.filter(([name]) => name === 'aventus/compiled'), [
        ['aventus/compiled', ['Demo@delayed', []]],
        ['aventus/compiled', ['Demo@delayed', []]],
    ]);
});
