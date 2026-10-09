import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { Build }, { GenericServer }, { DependencyManager }] = await loadServerModules([
    'project/Project.ts', 'project/Build.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
]);

test('one project builds two overlapping source sets into distinct JavaScript and package outputs', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.project-multi-round30-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousServer = GenericServer.instance;
    const previousDependencies = DependencyManager.instance;
    const notifications = [];
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 4,
        connection: {
            delayBetweenBuild: () => 0,
            sendNotification: (name, args) => notifications.push([name, args]),
        },
    };
    DependencyManager.instance = { getPath: () => root };
    t.after(() => {
        GenericServer.instance = previousServer;
        DependencyManager.instance = previousDependencies;
    });

    const sourceUri = 'file:///D:/app/src/shared/card.lib.avt';
    const otherUri = 'file:///D:/app/src/other/alone.lib.avt';
    const makeBuild = (name, pattern, className) => {
        const js = join(root, 'dist', `${name}.js`);
        const pkg = join(root, 'dist', `${name}.package.avt`);
        const build = Object.create(Build.prototype);
        build.initDone = true;
        build._allowBuild = true;
        build.buildConfig = {
            fullname: `Demo@${name}`, module: 'Demo', name, version: '1.0.0',
            srcPathRegex: pattern, rawDependencies: {},
            compile: [{ output: [{ '@default': { path: js } }], package: [pkg],
                outputNpm: { path: [], npmName: '', live: false } }],
        };
        build.diagnostics = new Map();
        build.scssLanguageService = { getInternalDocumentation: () => ({ colors: [] }) };
        build.npmBuilder = { compile: async () => ({ result: '', errors: [] }) };
        build.writeFile = async (path, content) => {
            mkdirSync(dirname(path), { recursive: true });
            writeFileSync(path, content);
        };
        build.buildOrderCompilationInfo = async () => ({ toCompile: [className], libSrc: [], errors: [] });
        build.buildLocalCode = async () => ({
            codeNoNamespaceBefore: [], code: [`class ${className} {}`],
            classesName: {}, codeNoNamespaceAfter: [], useDecorator: false,
            stylesheets: {}, htmlDoc: {}, doc: [`export class ${className} {}`],
            docNoNamespace: [], docInvisible: [], codeRenderInJs: [], codeNotRenderInJs: [],
        });
        return { build, js, pkg };
    };

    const broad = makeBuild('broad', /^D:\/app\/src\//, 'BroadCard');
    const shared = makeBuild('shared', /^D:\/app\/src\/shared\//, 'SharedCard');
    const project = Object.create(Project.prototype);
    project.builds = [broad.build, shared.build];
    project.statics = [];

    assert.deepEqual(project.getMatchingBuildsByUri(sourceUri), [broad.build, shared.build]);
    assert.deepEqual(project.getMatchingBuildsByUri(otherUri), [broad.build]);
    await project.buildAll();

    assert.match(readFileSync(broad.js, 'utf8'), /class BroadCard/);
    assert.doesNotMatch(readFileSync(broad.js, 'utf8'), /SharedCard/);
    assert.match(readFileSync(shared.js, 'utf8'), /class SharedCard/);
    assert.doesNotMatch(readFileSync(shared.js, 'utf8'), /BroadCard/);
    assert.match(readFileSync(broad.pkg, 'utf8'), /export class BroadCard/);
    assert.match(readFileSync(shared.pkg, 'utf8'), /export class SharedCard/);
    assert.deepEqual(notifications.filter(([name]) => name === 'aventus/compiled')
        .map(([, args]) => args[0]).sort(), ['Demo@broad', 'Demo@shared']);
});
