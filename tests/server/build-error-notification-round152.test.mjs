import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { DependencyManager }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
]);

test('full build publishes npm and source errors in compile order, then clears them after repair', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-errors-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = [GenericServer.instance, DependencyManager.instance];
    const notifications = [];
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 4,
        connection: {
            delayBetweenBuild: () => 0,
            sendNotification: (name, args) => notifications.push([name, args]),
            sendDiagnostics() {},
        },
    };
    DependencyManager.instance = { getPath: () => root };
    t.after(() => { [GenericServer.instance, DependencyManager.instance] = previous; });

    const outputs = [join(root, 'first.js'), join(root, 'second.js')];
    const build = Object.create(Build.prototype);
    Object.assign(build, {
        initDone: true, _allowBuild: true, diagnostics: new Map(),
        buildConfig: {
            fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0', rawDependencies: {},
            compile: outputs.map(path => ({
                output: [{ '@default': { path } }], package: [],
                outputNpm: { path: [], npmName: '', live: false },
            })),
        },
        scssLanguageService: { getInternalDocumentation: () => ({}) },
    });
    let broken = true;
    let compileIndex = 0;
    const npmErrors = [{ code: 'npm-one' }, { code: 'npm-two' }];
    const sourceErrors = [{ code: 'source-one' }, { code: 'source-two' }];
    build.npmBuilder = { compile: async () => ({
        result: '', errors: broken ? [npmErrors[compileIndex++]] : [],
    }) };
    build.buildOrderCompilationInfo = async () => ({
        toCompile: [], libSrc: [],
        errors: broken ? [sourceErrors[compileIndex]] : [],
    });
    build.buildLocalCode = async () => ({
        codeNoNamespaceBefore: [], code: [`class Revision${broken ? 'Broken' : 'Fixed'} {}`],
        codeNoNamespaceAfter: [], classesName: {}, stylesheets: {}, useDecorator: false,
        doc: [], docNoNamespace: [], docInvisible: [],
        codeRenderInJs: [], codeNotRenderInJs: [], htmlDoc: {},
    });
    build.writeFile = async (path, content) => {
        if (build.pendingOutputs) return build.pendingOutputs.set(path, content);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };

    await build.build();
    assert.deepEqual(notifications.filter(([name]) => name === 'aventus/compiled'), [
        ['aventus/compiled', ['Demo@web', [npmErrors[0], sourceErrors[0], npmErrors[1], sourceErrors[1]]]],
    ]);
    for (const path of outputs) assert.match(readFileSync(path, 'utf8'), /RevisionBroken/);

    broken = false;
    compileIndex = 0;
    await build.build();
    assert.deepEqual(notifications.filter(([name]) => name === 'aventus/compiled').at(-1),
        ['aventus/compiled', ['Demo@web', []]]);
    for (const path of outputs) {
        assert.match(readFileSync(path, 'utf8'), /RevisionFixed/);
        assert.doesNotMatch(readFileSync(path, 'utf8'), /RevisionBroken/);
    }
});
