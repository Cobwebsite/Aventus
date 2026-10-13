import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }, { DependencyManager }, { AventusPackageFile }] = await loadServerModules([
    'project/Build.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
    'language-services/ts/package/File.ts',
]);

test('a full rebuild adds, edits and removes generated JS, package definitions and npm sources', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-revision-'));
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

    const main = join(root, 'dist', 'main.js');
    const pkg = join(root, 'dist', 'Demo.package.avt');
    const npm = join(root, 'npm');
    const build = Object.create(Build.prototype);
    Object.assign(build, {
        initDone: true, _allowBuild: true,
        buildConfig: {
            fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0', rawDependencies: {},
            compile: [{ output: [{ '@default': { path: main } }], package: [pkg],
                outputNpm: { path: [npm], npmName: '@demo/web', packageJson: false, manifest: false, live: true } }],
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
    const sources = new Map([['Alpha', 'one']]);
    build.buildOrderCompilationInfo = async () => ({ toCompile: [...sources], libSrc: [], errors: [] });
    build.buildLocalCode = async files => ({
        codeNoNamespaceBefore: [],
        code: files.map(([name, value]) => `class ${name} { value = "${value}"; }`),
        classesName: {}, codeNoNamespaceAfter: [], useDecorator: false,
        stylesheets: {}, htmlDoc: {},
        doc: files.map(([name]) => `export class ${name} {}`), docNoNamespace: [], docInvisible: [],
        codeRenderInJs: [], codeNotRenderInJs: [],
        npm: { 'Demo': { content: files.map(([name]) => `export declare class ${name} {}`), imports: {} } },
        npmsrc: Object.fromEntries(files.map(([name, value]) => [
            `${name.toLowerCase()}.js`, { names: [`Demo.${name}`],
                content: [`export class ${name} { value = "${value}"; }`], imports: {},
                forcedDependencies: [], sourceUri: [] },
        ])),
    });
    const packageDefinitions = () => {
        const file = Object.create(AventusPackageFile.prototype);
        file._file = { contentUser: readFileSync(pkg, 'utf8') };
        file.version = { major: 0, minor: 0, patch: 0 };
        return file.separeSection().jsDef;
    };

    await build.build();
    assert.match(readFileSync(main, 'utf8'), /class Alpha.*one/);
    assert.match(packageDefinitions(), /class Alpha/);
    assert.match(readFileSync(join(npm, '__src', 'alpha.js'), 'utf8'), /one/);

    sources.set('Beta', 'first');
    await build.build();
    assert.match(readFileSync(main, 'utf8'), /class Beta.*first/);
    assert.match(packageDefinitions(), /class Beta/);
    assert.match(readFileSync(join(npm, 'Demo', 'index.js'), 'utf8'), /Alpha[^]*Beta/);

    sources.set('Beta', 'second');
    await build.build();
    assert.match(readFileSync(main, 'utf8'), /class Beta.*second/);
    assert.doesNotMatch(readFileSync(main, 'utf8'), /first/);
    assert.match(readFileSync(join(npm, '__src', 'beta.js'), 'utf8'), /second/);

    sources.delete('Alpha');
    await build.build();
    assert.doesNotMatch(readFileSync(main, 'utf8'), /class Alpha/);
    assert.doesNotMatch(packageDefinitions(), /class Alpha/);
    assert.equal(existsSync(join(npm, '__src', 'alpha.js')), false);
    assert.doesNotMatch(readFileSync(join(npm, 'Demo', 'index.js'), 'utf8'), /Alpha/);
    assert.equal(notifications.filter(([name]) => name === 'aventus/compiled').length, 4);
});
