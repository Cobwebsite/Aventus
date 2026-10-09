import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts',
]);

function fixture(t) {
    const root = mkdtempSync(join(import.meta.dirname, '.build-recovery-round32-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const notifications = [];
    const previous = GenericServer.instance;
    GenericServer.instance = {
        _noBuild: false, logLevel: 4,
        connection: {
            delayBetweenBuild: () => 0,
            sendNotification: (name, args) => notifications.push([name, args]),
        },
    };
    t.after(() => { GenericServer.instance = previous; });

    const paths = [join(root, 'first.js'), join(root, 'second.js')];
    const configurations = paths.map((path, index) => ({
        id: index, output: [{ '@default': { path } }], package: [],
        outputNpm: { live: false },
    }));
    const build = Object.create(Build.prototype);
    build.initDone = true;
    build._allowBuild = true;
    build.buildConfig = { fullname: 'Demo@multi', module: 'Demo', compile: configurations };
    build.diagnostics = new Map();
    build.npmBuilder = { compile: async () => ({ result: '', errors: [] }) };
    build.writeBuildDocumentation = async () => {};
    let revision = 'Initial';
    let dependencyError = false;
    let failedPath = null;
    build.buildOrderCompilationInfo = async config => ({
        toCompile: [config.id], libSrc: [],
        errors: config.id === 1 && dependencyError ? [{ message: 'dependency unavailable' }] : [],
    });
    build.buildLocalCode = async files => ({
        codeNoNamespaceBefore: [], code: [`class ${revision}${files[0]} {}`],
        classesName: {}, codeNoNamespaceAfter: [], stylesheets: {}, useDecorator: false,
        codeRenderInJs: [], codeNotRenderInJs: [],
    });
    build.writeFile = async (path, content) => {
        if (path === failedPath) throw new Error('output unavailable');
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    return {
        build, paths, notifications,
        setRevision: value => { revision = value; },
        setDependencyError: value => { dependencyError = value; },
        setFailedPath: value => { failedPath = value; },
    };
}

test('a dependency error in the second configuration is reported and clears on rebuild', async t => {
    const fixtureState = fixture(t);
    const { build, paths, notifications } = fixtureState;
    fixtureState.setDependencyError(true);
    await build.build();
    assert.match(readFileSync(paths[0], 'utf8'), /Initial0/);
    assert.match(readFileSync(paths[1], 'utf8'), /Initial1/);
    assert.deepEqual(notifications.filter(([name]) => name === 'aventus/compiled')
        .map(([, args]) => args[1]), [[{ message: 'dependency unavailable' }]]);

    fixtureState.setDependencyError(false);
    fixtureState.setRevision('Recovered');
    await build.build();
    assert.match(readFileSync(paths[0], 'utf8'), /Recovered0/);
    assert.match(readFileSync(paths[1], 'utf8'), /Recovered1/);
    assert.deepEqual(notifications.filter(([name]) => name === 'aventus/compiled')
        .map(([, args]) => args[1]), [[{ message: 'dependency unavailable' }], []]);
});

test('a failed second output preserves the first output and the next build recovers both', async t => {
    const fixtureState = fixture(t);
    const { build, paths, notifications } = fixtureState;
    await build.build();
    fixtureState.setRevision('Interrupted');
    fixtureState.setFailedPath(paths[1]);
    await assert.rejects(build.build(), /output unavailable/);
    assert.match(readFileSync(paths[0], 'utf8'), /Interrupted0/);
    assert.match(readFileSync(paths[1], 'utf8'), /Initial1/);
    assert.equal(notifications.filter(([name]) => name === 'aventus/compiled').length, 1);

    fixtureState.setFailedPath(null);
    fixtureState.setRevision('Recovered');
    await build.build();
    assert.match(readFileSync(paths[0], 'utf8'), /Recovered0/);
    assert.match(readFileSync(paths[1], 'utf8'), /Recovered1/);
    assert.deepEqual(notifications.filter(([name]) => name === 'aventus/compiled')
        .map(([, args]) => args[1]), [[], []]);
});
