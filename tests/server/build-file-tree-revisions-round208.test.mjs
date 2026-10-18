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

test('a rebuild tracks real source-file additions, edits and deletions in two npm and package destinations', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-build-files-round208-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousServer = GenericServer.instance;
    const previousDependencies = DependencyManager.instance;
    GenericServer.instance = {
        _noBuild: false, isIDE: false, logLevel: 4,
        connection: { delayBetweenBuild: () => 0, sendNotification() {}, sendDiagnostics() {} },
    };
    DependencyManager.instance = { getPath: () => join(root, 'cache') };
    t.after(() => { GenericServer.instance = previousServer; DependencyManager.instance = previousDependencies; });

    const src = join(root, 'src');
    const first = join(src, 'First.ts');
    const second = join(src, 'Second.ts');
    mkdirSync(src);
    writeFileSync(first, 'first-v1');
    const output = join(root, 'dist', 'main.js');
    const packages = [join(root, 'dist', 'First.package.avt'), join(root, 'mirror', 'First.package.avt')];
    const npmRoots = [join(root, 'npm-a'), join(root, 'npm-b')];

    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
    Object.assign(build, {
        initDone: true, _allowBuild: true,
        buildConfig: {
            fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.0.0', rawDependencies: {},
            compile: [{ output: [{ '@default': { path: output } }], package: packages,
                outputNpm: { path: npmRoots, npmName: '@demo/web', packageJson: false, manifest: false, live: true } }],
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
    build.buildOrderCompilationInfo = async () => ({
        toCompile: [first, second].filter(existsSync).map(path => [path.split(/[\\/]/).at(-1).slice(0, -3), readFileSync(path, 'utf8')]),
        libSrc: [], errors: [],
    });
    build.buildLocalCode = async files => ({
        codeNoNamespaceBefore: [],
        code: files.map(([name, value]) => `class ${name} { value = "${value}"; }`),
        classesName: {}, codeNoNamespaceAfter: [], useDecorator: false,
        stylesheets: {}, htmlDoc: {},
        doc: files.map(([name]) => `export class ${name} {}`), docNoNamespace: [], docInvisible: [],
        codeRenderInJs: [], codeNotRenderInJs: [],
        npm: { Demo: { content: files.map(([name]) => `export declare class ${name} {}`), imports: {} } },
        npmsrc: Object.fromEntries(files.map(([name, value]) => [
            `${name.toLowerCase()}.js`, { names: [`Demo.${name}`],
                content: [`export class ${name} { value = "${value}"; }`], imports: {},
                forcedDependencies: [], sourceUri: [] },
        ])),
    });

    const packageDefinitions = path => {
        const file = Object.create(AventusPackageFile.prototype);
        file._file = { contentUser: readFileSync(path, 'utf8') };
        file.version = { major: 0, minor: 0, patch: 0 };
        return file.separeSection().jsDef;
    };
    const check = (expected, absent) => {
        const js = readFileSync(output, 'utf8');
        for (const token of expected) assert.match(js, new RegExp(token));
        for (const token of absent) assert.doesNotMatch(js, new RegExp(token));
        for (const path of packages) {
            const defs = packageDefinitions(path);
            for (const token of expected.filter(token => token === 'First' || token === 'Second')) assert.match(defs, new RegExp(token));
            for (const token of absent.filter(token => token === 'First' || token === 'Second')) assert.doesNotMatch(defs, new RegExp(token));
        }
        for (const npmRoot of npmRoots) {
            const index = readFileSync(join(npmRoot, 'Demo', 'index.js'), 'utf8');
            for (const token of expected.filter(token => token === 'First' || token === 'Second')) assert.match(index, new RegExp(token));
            for (const token of absent.filter(token => token === 'First' || token === 'Second')) assert.doesNotMatch(index, new RegExp(token));
            for (const name of ['First', 'Second']) assert.equal(existsSync(join(npmRoot, '__src', `${name.toLowerCase()}.js`)), expected.includes(name));
        }
    };

    await build.build();
    check(['First', 'first-v1'], ['Second']);
    writeFileSync(second, 'second-v1');
    await build.build();
    check(['First', 'Second', 'first-v1', 'second-v1'], []);
    writeFileSync(first, 'first-v2');
    await build.build();
    check(['First', 'Second', 'first-v2', 'second-v1'], ['first-v1']);
    rmSync(second);
    await build.build();
    check(['First', 'first-v2'], ['Second', 'second-v1']);
});
