import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { AventusTsFile }, { AventusPackageFile }, { DependencyManager }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'language-services/ts/File.ts', 'language-services/ts/package/File.ts',
    'project/DependencyManager.ts',
]);

test('changes to logic, style and view cancel the in-flight revision and publish after build resumes', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.build-burst-round50-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const output = join(root, 'main.js');
    const pkg = join(root, 'Demo.package.avt');
    const diagnostics = [];
    const compiled = [];
    const previous = GenericServer.instance;
    const previousDependencies = DependencyManager.instance;
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 4,
        connection: {
            delayBetweenBuild: () => 0,
            sendDiagnostics: (params, buildName) => diagnostics.push([params, buildName]),
            sendNotification: (name, args) => compiled.push([name, args]),
        },
    };
    DependencyManager.instance = { getPath: () => root };
    t.after(() => { GenericServer.instance = previous; DependencyManager.instance = previousDependencies; });

    const source = Object.create(AventusTsFile.prototype);
    Object.defineProperty(source, 'file', { value: { uri: 'file:///demo/src/widget.lib.avt' } });
    source.getDiagnostics = () => [];
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    build.initDone = true;
    build._allowBuild = true;
    build.buildConfig = {
        fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0',
        compile: [{ output: [{ '@default': { path: output } }], package: [pkg],
            outputNpm: { path: [], npmName: '', live: false } }],
    };
    build.diagnostics = new Map();
    build.npmBuilder = { compile: async () => ({ result: '', errors: [] }) };
    build.scssLanguageService = { getInternalDocumentation: () => ({}) };
    build.writeFile = async (path, content) => writeFileSync(path, content);

    let revision = { name: 'First', style: '.first{color:red}', view: '<p>first</p>', error: true };
    let startFirst;
    const firstStarted = new Promise(resolve => { startFirst = resolve; });
    let releaseFirst;
    const firstGate = new Promise(resolve => { releaseFirst = resolve; });
    let builds = 0;
    build.buildOrderCompilationInfo = async () => {
        const snapshot = { ...revision };
        if (++builds === 1) {
            startFirst();
            await firstGate;
        }
        return { toCompile: [snapshot], libSrc: [], errors: [] };
    };
    build.buildLocalCode = async ([snapshot]) => {
        if (snapshot.error) build.addDiagnostic(source, { message: 'first revision error', severity: 1 });
        return {
            codeNoNamespaceBefore: [], code: [`class ${snapshot.name} {}`],
            classesName: {}, codeNoNamespaceAfter: [], useDecorator: false,
            stylesheets: { [snapshot.name]: snapshot.style },
            htmlDoc: { [snapshot.name]: snapshot.view },
            doc: [`export class ${snapshot.name} {}`], docNoNamespace: [], docInvisible: [],
            codeRenderInJs: [], codeNotRenderInJs: [],
        };
    };

    const first = build.build();
    await firstStarted;
    build._allowBuild = false;
    revision = { name: 'Second', style: '.second{color:blue}', view: '<p>second</p>', error: false };
    const second = build.build();
    revision = { name: 'Final', style: '.final{color:green}', view: '<p>final</p>', error: false };
    const third = build.build();
    assert.equal(builds, 1, 'disabled build requests do not start a new compilation');

    releaseFirst();
    await Promise.all([first, second, third]);
    assert.equal(builds, 1);

    build._allowBuild = true;
    await build.build();
    const result = readFileSync(output, 'utf8');
    const packageFile = Object.create(AventusPackageFile.prototype);
    packageFile._file = { contentUser: readFileSync(pkg, 'utf8') };
    packageFile.version = { major: 0, minor: 0, patch: 0 };
    const sections = packageFile.separeSection();
    assert.match(result, /class Final/);
    assert.match(result, /Aventus\.Style\.store\("Final"/);
    assert.doesNotMatch(result, /class First|class Second|Style\.store\("First"|Style\.store\("Second"/);
    assert.deepEqual(JSON.parse(sections.scssTxt), { Final: '.final{color:green}' });
    assert.deepEqual(JSON.parse(sections.htmlTxt), { Final: '<p>final</p>' });
    assert.match(sections.jsDef, /export class Final/);
    assert.doesNotMatch(sections.jsDef, /export class First|export class Second/);
    assert.equal(builds, 2);
    assert.deepEqual(diagnostics, []);
    assert.equal(build.diagnostics.size, 0);
    assert.equal(compiled.filter(([name]) => name === 'aventus/compiled').length, 1);
});
