import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { DependencyManager }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
]);

function makeBuild(root, units) {
    const build = Object.create(Build.prototype);
    Object.assign(build, {
        initDone: true, _allowBuild: true,
        buildConfig: {
            fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0',
            rawDependencies: {}, compile: units,
        },
        project: { getConfigFile: () => ({ folderPath: root }) },
        diagnostics: new Map(), scssLanguageService: { getInternalDocumentation: () => ({}) },
        npmBuilder: { compile: async () => ({ result: '', errors: [] }) },
        externalPackageInformation: { filesUri: [], getByUri: () => undefined },
        tsFiles: {},
    });
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    build.buildOrderCompilationInfo = async unit => ({ toCompile: [unit.id], libSrc: [], errors: [] });
    build.buildLocalCode = async ([id]) => ({
        codeNoNamespaceBefore: [], code: [`class ${id} {}`],
        classesName: {}, codeNoNamespaceAfter: [], useDecorator: false,
        stylesheets: {}, htmlDoc: {}, doc: [`export class ${id} {}`],
        docNoNamespace: [], docInvisible: [], codeRenderInJs: [], codeNotRenderInJs: [],
        npm: { Demo: { content: [], imports: {} } }, npmsrc: {},
    });
    return build;
}

function unit(id, output, pkg, npmPath, live) {
    return {
        id, output: [{ '@default': { path: output } }], package: [pkg],
        outputNpm: { path: [npmPath], npmName: '@demo/web', packageJson: false, manifest: false, live },
    };
}

function setup(t, root) {
    const previousServer = GenericServer.instance;
    const previousDependencies = DependencyManager.instance;
    const notifications = [];
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 4,
        connection: { delayBetweenBuild: () => 0, sendNotification: (name, args) => notifications.push([name, args]), sendDiagnostics() {} },
    };
    DependencyManager.instance = { getPath: () => root };
    t.after(() => {
        GenericServer.instance = previousServer;
        DependencyManager.instance = previousDependencies;
    });
    return notifications;
}

test('one build publishes each compile unit to its own JS and package destination', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-two-units-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const notifications = setup(t, root);
    const firstJs = join(root, 'first', 'main.js');
    const secondJs = join(root, 'second', 'main.js');
    const firstPkg = join(root, 'first', 'Demo.package.avt');
    const secondPkg = join(root, 'second', 'Demo.package.avt');
    const build = makeBuild(root, [
        unit('Alpha', firstJs, firstPkg, join(root, 'npm-first'), false),
        unit('Beta', secondJs, secondPkg, join(root, 'npm-second'), false),
    ]);

    await build.build();
    assert.match(readFileSync(firstJs, 'utf8'), /class Alpha/);
    assert.doesNotMatch(readFileSync(firstJs, 'utf8'), /class Beta/);
    assert.match(readFileSync(secondJs, 'utf8'), /class Beta/);
    assert.doesNotMatch(readFileSync(secondJs, 'utf8'), /class Alpha/);
    assert.match(readFileSync(firstPkg, 'utf8'), /class Alpha/);
    assert.match(readFileSync(secondPkg, 'utf8'), /class Beta/);
    assert.equal(notifications.filter(([name]) => name === 'aventus/compiled').length, 1);
});

test('a full build with live npm disabled publishes JS and package without npm sources', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-npm-disabled-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    setup(t, root);
    const js = join(root, 'dist', 'main.js');
    const pkg = join(root, 'dist', 'Demo.package.avt');
    const npmPath = join(root, 'npm');
    const build = makeBuild(root, [unit('Offline', js, pkg, npmPath, false)]);

    await build.build();
    assert.match(readFileSync(js, 'utf8'), /class Offline/);
    assert.match(readFileSync(pkg, 'utf8'), /class Offline/);
    assert.equal(existsSync(join(npmPath, '__src')), false);
});
