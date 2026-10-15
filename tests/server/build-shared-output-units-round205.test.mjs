import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { DependencyManager }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
]);

test('compile units sharing one JS destination overwrite in compile order across rebuilds', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-shared-units-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousServer = GenericServer.instance;
    const previousDependencies = DependencyManager.instance;
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
        GenericServer.instance = previousServer;
        DependencyManager.instance = previousDependencies;
    });

    const output = join(root, 'dist', 'shared.js');
    const unit = id => ({
        id, output: [{ '@default': { path: output } }], package: [],
        outputNpm: { path: [], npmName: '', live: false },
    });
    const first = unit('First');
    const second = unit('Second');
    const build = Object.create(Build.prototype);
    Object.assign(build, {
        initDone: true, _allowBuild: true,
        buildConfig: {
            fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0',
            rawDependencies: {}, compile: [first, second],
        },
        project: { getConfigFile: () => ({ folderPath: root }) },
        diagnostics: new Map(), scssLanguageService: { getInternalDocumentation: () => ({}) },
        npmBuilder: { compile: async () => ({ result: '', errors: [] }) },
        externalPackageInformation: { filesUri: [], getByUri: () => undefined }, tsFiles: {},
    });
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    build.buildOrderCompilationInfo = async compile => ({ toCompile: [compile.id], libSrc: [], errors: [] });
    build.buildLocalCode = async ([id]) => ({
        codeNoNamespaceBefore: [], code: [`class ${id} {}`], classesName: {},
        codeNoNamespaceAfter: [], stylesheets: {}, useDecorator: false,
        doc: [], docNoNamespace: [], docInvisible: [], htmlDoc: {},
        codeRenderInJs: [], codeNotRenderInJs: [], npm: {}, npmsrc: {},
    });

    await build.build();
    assert.match(readFileSync(output, 'utf8'), /class Second/);
    assert.doesNotMatch(readFileSync(output, 'utf8'), /class First/);
    assert.deepEqual(notifications.at(-1), ['aventus/compiled', ['Demo@web', []]]);

    build.buildConfig.compile = [second, first];
    await build.build();
    assert.match(readFileSync(output, 'utf8'), /class First/);
    assert.doesNotMatch(readFileSync(output, 'utf8'), /class Second/);
    assert.deepEqual(notifications.at(-1), ['aventus/compiled', ['Demo@web', []]]);
    assert.equal(notifications.length, 2);
});
