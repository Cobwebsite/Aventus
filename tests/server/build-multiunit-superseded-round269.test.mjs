import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts',
]);

test('a newer build discards both units of a revision superseded during its second unit', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-multiunit-revision-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousServer = GenericServer.instance;
    const notifications = [];
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 99,
        connection: {
            delayBetweenBuild: () => 0,
            sendNotification: (name, args) => notifications.push([name, args]),
            sendDiagnostics() {},
        },
    };
    t.after(() => { GenericServer.instance = previousServer; });

    const paths = [join(root, 'first.js'), join(root, 'second.js')];
    const units = paths.map((path, index) => ({
        index, output: [{ '@default': { path } }], package: [],
        outputNpm: { path: [], live: false },
    }));
    const build = Object.create(Build.prototype);
    Object.assign(build, {
        initDone: true, _allowBuild: true, buildRevision: 0,
        diagnostics: new Map(),
        buildConfig: { fullname: 'Demo@multiunit', module: 'Demo', compile: units },
        npmBuilder: { compile: async () => ({ result: '', errors: [] }) },
    });
    build.writeBuildDocumentation = async () => {};
    build.writeFile = async (path, content) => { writeFileSync(path, content); };

    let revision = 'Old';
    let startedSecond;
    let releaseSecond;
    const secondStarted = new Promise(resolve => { startedSecond = resolve; });
    const secondGate = new Promise(resolve => { releaseSecond = resolve; });
    build.buildOrderCompilationInfo = async unit => {
        const capturedRevision = revision;
        if (capturedRevision === 'Old' && unit.index === 1) {
            startedSecond();
            await secondGate;
        }
        return { toCompile: [unit.index, capturedRevision], libSrc: [], errors: [] };
    };
    build.buildLocalCode = async ([index, capturedRevision]) => ({
        codeNoNamespaceBefore: [], code: [`class ${capturedRevision}${index} {}`],
        classesName: {}, codeNoNamespaceAfter: [], stylesheets: {}, useDecorator: false,
        codeRenderInJs: [], codeNotRenderInJs: [],
    });

    const oldBuild = build.build();
    await secondStarted;
    revision = 'New';
    const newBuild = build.build();
    releaseSecond();
    await Promise.all([oldBuild, newBuild]);

    assert.match(readFileSync(paths[0], 'utf8'), /class New0/);
    assert.match(readFileSync(paths[1], 'utf8'), /class New1/);
    for (const path of paths) assert.doesNotMatch(readFileSync(path, 'utf8'), /Old/);
    assert.equal(notifications.filter(([name]) => name === 'aventus/compiled').length, 1);
});
