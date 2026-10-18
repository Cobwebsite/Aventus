import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { DependencyManager }, { AventusPackageFile }, { ManifestPackage }, { pathToUri }] = await loadServerModules([
    'project/Build.ts', 'project/DependencyManager.ts', 'language-services/ts/package/File.ts',
    'manifest/ManifestPackage.ts', 'tools.ts',
]);

test('generated package switches dependency branches and removes stale executable code after rewrites', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-package-rewire-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        dependency: DependencyManager.instance,
        files: ManifestPackage.files,
        done: ManifestPackage.done,
    };
    DependencyManager.instance = { getPath: () => root };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    t.after(() => {
        DependencyManager.instance = previous.dependency;
        ManifestPackage.files = previous.files;
        ManifestPackage.done = previous.done;
    });

    const names = ['First', 'Second', 'Consumer'];
    const paths = Object.fromEntries(names.map(name => [name, join(root, `${name}.package.avt`)]));
    const dependency = name => ({ uri: paths[name], version: '1.0.0', include: 'full' });
    const write = async (name, rawDependencies, code) => {
        const build = Object.create(Build.prototype);
        build.buildRevision = 0;
        build.buildConfig = {
            fullname: name, module: name, name: 'web', version: '1.0.0', rawDependencies,
        };
        build.scssLanguageService = { getInternalDocumentation: () => ({}) };
        build.writeFile = async (path, content) => {
            mkdirSync(dirname(path), { recursive: true });
            writeFileSync(path, content);
        };
        await build.writeBuildDocumentation([paths[name]], {
            doc: [`export class ${name}Item {}`], docNoNamespace: [], docInvisible: [],
            stylesheets: {}, htmlDoc: {}, codeRenderInJs: [], codeNotRenderInJs: [],
        }, {
            namespace: name, available: [{ fullName: `${name}.Item`, code }], existing: [],
        }, { path: [], npmName: '' });
        assert.equal(readFileSync(join(root, '@locals', `${name}.package.avt`), 'utf8'),
            readFileSync(paths[name], 'utf8'));
    };

    await write('First', {}, 'globalThis.first = 4;');
    await write('Second', {}, 'globalThis.second = 7;');
    await write('Consumer', { First: dependency('First') }, 'globalThis.result = globalThis.first + 1;');

    const manager = Object.create(DependencyManager.prototype);
    manager.predefinedPaths = { 'Aventus@Main': join(root, 'Aventus@Main.package.avt') };
    manager.predefinedNpm = {};
    manager.loadByUri = async (_build, uri) => {
        if (uri === pathToUri(manager.predefinedPaths['Aventus@Main'])) {
            return { name: 'Aventus@Main', dependencies: {}, file: { uri, contentUser: '' }, loadWebComponents() {} };
        }
        const name = names.find(candidate => pathToUri(paths[candidate]) === uri);
        assert.ok(name, `unexpected package URI: ${uri}`);
        const file = Object.create(AventusPackageFile.prototype);
        file._file = { uri, contentUser: readFileSync(paths[name], 'utf8') };
        file.version = { major: 0, minor: 0, patch: 0 };
        const sections = file.separeSection();
        assert.ok(sections);
        file.dependencies = JSON.parse(sections.depsTxt);
        file.srcInfo = JSON.parse(sections.jsSrc);
        file.loadWebComponents = () => {};
        return file;
    };
    const resolve = async () => {
        const loaded = await manager.loadDependenciesFromBuild({ dependencies: {
            Consumer: dependency('Consumer'),
        } }, { buildConfig: {} });
        const context = {};
        for (const file of loaded.files) {
            for (const item of file.srcInfo?.available ?? []) runInNewContext(item.code, context);
        }
        return { names: loaded.files.map(file => file.name), uris: loaded.dependencyFullUris, context };
    };

    const first = await resolve();
    assert.deepEqual(first.names, ['Aventus@Main', 'First', 'Consumer']);
    assert.deepEqual(first.uris, [pathToUri(paths.First), pathToUri(paths.Consumer)]);
    assert.equal(first.context.result, 5);
    assert.equal(first.context.second, undefined);

    await write('Consumer', { Second: dependency('Second') }, 'globalThis.result = globalThis.second * 2;');
    const second = await resolve();
    assert.deepEqual(second.names, ['Aventus@Main', 'Second', 'Consumer']);
    assert.deepEqual(second.uris, [pathToUri(paths.Second), pathToUri(paths.Consumer)]);
    assert.equal(second.context.result, 14);
    assert.equal(second.context.first, undefined);

    await write('Consumer', {}, 'globalThis.result = 3;');
    const third = await resolve();
    assert.deepEqual(third.names, ['Aventus@Main', 'Consumer']);
    assert.deepEqual(third.uris, [pathToUri(paths.Consumer)]);
    assert.equal(third.context.result, 3);
    assert.equal(third.context.first, undefined);
    assert.equal(third.context.second, undefined);
    assert.deepEqual(JSON.parse(Object.assign(Object.create(AventusPackageFile.prototype), {
        _file: { contentUser: readFileSync(paths.Consumer, 'utf8') },
        version: { major: 0, minor: 0, patch: 0 },
    }).separeSection().depsTxt), {});
});
