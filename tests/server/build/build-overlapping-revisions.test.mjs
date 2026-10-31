import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts',
]);

test('overlapping compilations finish with the newest revision in the output', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-overlap-build-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const output = join(root, 'main.js');
    const previousServer = GenericServer.instance;
    const notifications = [];
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 99,
        connection: {
            delayBetweenBuild: () => 0,
            sendNotification: (name, args) => notifications.push([name, args]),
        },
    };
    t.after(() => { GenericServer.instance = previousServer; });

    const written = new Map();
    const build = Object.create(Build.prototype);
    Object.assign(build, {
        initDone: true, _allowBuild: true, buildRevision: 0, diagnostics: new Map(),
        buildConfig: {
            fullname: 'Demo@overlap', module: 'Demo',
            compile: [{
                output: [{ '@default': { path: output } }], package: [],
                outputNpm: { live: false },
            }],
        },
        npmBuilder: { compile: async () => ({ result: '', errors: [] }) },
    });
    build.buildOrderCompilationInfo = async () => ({ toCompile: [], libSrc: [], errors: [] });
    build.writeBuildDocumentation = async () => {};
    build.writeFile = async (path, content) => { written.set(path, content); };

    let revision = 'First';
    let beginFirst;
    let releaseFirst;
    const firstStarted = new Promise(resolve => { beginFirst = resolve; });
    const firstGate = new Promise(resolve => { releaseFirst = resolve; });
    build.buildLocalCode = async () => {
        const capturedRevision = revision;
        if (capturedRevision === 'First') {
            beginFirst();
            await firstGate;
        }
        return {
            codeNoNamespaceBefore: [], code: [`class ${capturedRevision} {}`],
            classesName: {}, codeNoNamespaceAfter: [], stylesheets: {}, useDecorator: false,
            codeRenderInJs: [], codeNotRenderInJs: [],
        };
    };

    const firstBuild = build.build();
    await firstStarted;
    revision = 'Second';
    const secondBuild = build.build();
    try {
        assert.equal(written.has(output), false);
    } finally {
        releaseFirst();
        await firstBuild;
    }

    await secondBuild;
    assert.match(written.get(output), /class Second/);
    assert.doesNotMatch(written.get(output), /class First/);
    assert.equal(notifications.filter(([name]) => name === 'aventus/compiled').length, 1);
});
