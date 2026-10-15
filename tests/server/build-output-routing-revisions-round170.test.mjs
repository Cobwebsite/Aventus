import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { DependencyManager }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
]);

test('a full rebuild routes npm, library and module code across two output groups after a revision', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-routing-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousServer = GenericServer.instance;
    const previousDependencies = DependencyManager.instance;
    const notifications = [];
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 4,
        connection: { delayBetweenBuild: () => 0, sendNotification: (name, args) => notifications.push([name, args]), sendDiagnostics() {} },
    };
    DependencyManager.instance = { getPath: () => root };
    t.after(() => { GenericServer.instance = previousServer; DependencyManager.instance = previousDependencies; });

    const destinations = Object.fromEntries(['main-a', 'vendor-a', 'npm-a', 'main-b', 'vendor-b', 'npm-b']
        .map(name => [name, join(root, 'dist', `${name}.js`)]));
    const output = (suffix, separated) => ({
        '@default': { path: destinations[`main-${suffix}`] },
        Vendor: { path: separated ? destinations[`vendor-${suffix}`] : destinations[`main-${suffix}`] },
        '@npm': { path: separated ? destinations[`npm-${suffix}`] : destinations[`main-${suffix}`] },
    });
    const unit = {
        output: [output('a', true), output('b', true)], package: [],
        outputNpm: { path: [], npmName: '@demo/web', packageJson: false, manifest: false, live: false },
    };
    const build = Object.create(Build.prototype);
    Object.assign(build, {
        initDone: true, _allowBuild: true,
        buildConfig: { fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0', rawDependencies: {}, compile: [unit] },
        project: { getConfigFile: () => ({ folderPath: root }) },
        diagnostics: new Map(), scssLanguageService: { getInternalDocumentation: () => ({}) },
        externalPackageInformation: { filesUri: [], getByUri: () => undefined }, tsFiles: {},
    });
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    let revision = 'First';
    build.npmBuilder = { compile: async () => ({ result: `/* npm ${revision} */\n`, errors: [] }) };
    build.buildOrderCompilationInfo = async () => ({ toCompile: [], libSrc: [{ lib: 'Vendor', code: `/* vendor ${revision} */` }], errors: [] });
    build.buildLocalCode = async () => ({
        codeNoNamespaceBefore: [], code: [`class ${revision} {}`], classesName: {},
        codeNoNamespaceAfter: [], useDecorator: false, stylesheets: {}, htmlDoc: {},
        doc: [], docNoNamespace: [], docInvisible: [], codeRenderInJs: [], codeNotRenderInJs: [],
        npm: {}, npmsrc: {},
    });
    const content = name => readFileSync(destinations[name], 'utf8');

    await build.build();
    for (const suffix of ['a', 'b']) {
        assert.match(content(`main-${suffix}`), /class First/);
        assert.doesNotMatch(content(`main-${suffix}`), /vendor First|npm First/);
        assert.match(content(`vendor-${suffix}`), /vendor First/);
        assert.doesNotMatch(content(`vendor-${suffix}`), /class First|npm First/);
        assert.match(content(`npm-${suffix}`), /npm First/);
        assert.doesNotMatch(content(`npm-${suffix}`), /class First|vendor First/);
    }

    revision = 'Second';
    unit.output = [output('a', false), output('b', false)];
    await build.build();
    for (const suffix of ['a', 'b']) {
        assert.match(content(`main-${suffix}`), /npm Second[^]*vendor Second[^]*class Second/);
        assert.doesNotMatch(content(`main-${suffix}`), /First/);
        // Changing the routing leaves the formerly separate generated outputs on disk.
        assert.match(content(`vendor-${suffix}`), /vendor First/);
        assert.match(content(`npm-${suffix}`), /npm First/);
    }
    assert.equal(notifications.filter(([name]) => name === 'aventus/compiled').length, 2);
});
