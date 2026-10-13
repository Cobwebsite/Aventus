import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { DependencyManager }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
]);

test('a package serialization failure leaves staged JS and package outputs unchanged, then recovers', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-package-recovery-'));
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
    t.after(() => {
        [GenericServer.instance, DependencyManager.instance] = previous;
    });

    const main = join(root, 'dist', 'main.js');
    const pkg = join(root, 'dist', 'Demo.package.avt');
    const local = join(root, '@locals', 'Demo@web.package.avt');
    const build = Object.create(Build.prototype);
    build.initDone = true;
    build._allowBuild = true;
    build.buildConfig = {
        fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0', rawDependencies: {},
        compile: [{ output: [{ '@default': { path: main } }], package: [pkg],
            outputNpm: { path: [], npmName: '', live: false } }],
    };
    build.diagnostics = new Map();
    build.npmBuilder = { compile: async () => ({ result: '', errors: [] }) };
    let revision = 'Original';
    let failDocumentation = false;
    let failPublishedPath = null;
    build.scssLanguageService = {
        getInternalDocumentation() {
            if (failDocumentation) throw new Error('SCSS documentation unavailable');
            return { revision };
        },
    };
    build.buildOrderCompilationInfo = async () => ({ toCompile: [], libSrc: [], errors: [] });
    build.buildLocalCode = async () => ({
        codeNoNamespaceBefore: [], code: [`class ${revision} {}`], codeNoNamespaceAfter: [],
        classesName: {}, stylesheets: {}, useDecorator: false,
        doc: [`export declare class ${revision} {}`], docNoNamespace: [], docInvisible: [],
        codeRenderInJs: [], codeNotRenderInJs: [], htmlDoc: {},
    });
    build.writeFile = async (path, content) => {
        if (build.pendingOutputs) {
            build.pendingOutputs.set(path, content);
        } else {
            if (path === failPublishedPath) throw new Error('local package unavailable');
            mkdirSync(dirname(path), { recursive: true });
            writeFileSync(path, content);
        }
    };

    await build.build();
    const original = [main, pkg, local].map(path => readFileSync(path, 'utf8'));
    assert.match(original[0], /class Original/);
    assert.match(original[1], /export declare class Original/);

    revision = 'Interrupted';
    failDocumentation = true;
    await assert.rejects(build.build(), /SCSS documentation unavailable/);
    assert.deepEqual([main, pkg, local].map(path => readFileSync(path, 'utf8')), original);
    assert.equal(build.pendingOutputs, undefined);
    assert.equal(build.pendingDeletions, undefined);
    assert.equal(notifications.filter(([name]) => name === 'aventus/compiled').length, 1);

    failDocumentation = false;
    revision = 'Recovered';
    await build.build();
    for (const path of [main, pkg, local]) assert.equal(existsSync(path), true);
    assert.match(readFileSync(main, 'utf8'), /class Recovered/);
    assert.doesNotMatch(readFileSync(main, 'utf8'), /class Original|class Interrupted/);
    assert.match(readFileSync(pkg, 'utf8'), /export declare class Recovered/);
    assert.match(readFileSync(local, 'utf8'), /export declare class Recovered/);
    assert.deepEqual(notifications.filter(([name]) => name === 'aventus/compiled')
        .map(([, args]) => args[1]), [[], []]);

    const recovered = [main, pkg, local].map(path => readFileSync(path, 'utf8'));
    failPublishedPath = local;
    revision = 'Unpublished';
    await assert.rejects(build.build(), /local package unavailable/);
    assert.deepEqual([main, pkg, local].map(path => readFileSync(path, 'utf8')), recovered);
    assert.equal(notifications.filter(([name]) => name === 'aventus/compiled').length, 2);

    failPublishedPath = null;
    revision = 'AfterRetry';
    await build.build();
    assert.match(readFileSync(main, 'utf8'), /class AfterRetry/);
    assert.match(readFileSync(pkg, 'utf8'), /export declare class AfterRetry/);
    assert.match(readFileSync(local, 'utf8'), /export declare class AfterRetry/);
    assert.equal(notifications.filter(([name]) => name === 'aventus/compiled').length, 3);
});
