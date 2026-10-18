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

test('generated package can switch between its local copy and an explicit external path across revisions', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-local-external-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        dependency: DependencyManager.instance, files: ManifestPackage.files, done: ManifestPackage.done,
    };
    DependencyManager.instance = { getPath: () => root };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    t.after(() => {
        DependencyManager.instance = previous.dependency;
        ManifestPackage.files = previous.files;
        ManifestPackage.done = previous.done;
    });

    const local = join(root, '@locals', 'Source.package.avt');
    const external = join(root, 'external', 'Source.package.avt');
    const consumer = join(root, 'Consumer.package.avt');
    const write = async (name, output, dependencies, code) => {
        const build = Object.create(Build.prototype);
        build.buildRevision = 0;
        build.buildConfig = {
            fullname: name, module: name, name: 'web', version: '1.0.0', rawDependencies: dependencies,
        };
        build.scssLanguageService = { getInternalDocumentation: () => ({}) };
        build.writeFile = async (path, content) => {
            mkdirSync(dirname(path), { recursive: true });
            writeFileSync(path, content);
        };
        await build.writeBuildDocumentation([output], {
            doc: [`export const ${name}Value = true;`], docNoNamespace: [], docInvisible: [],
            stylesheets: {}, htmlDoc: {}, codeRenderInJs: [], codeNotRenderInJs: [],
        }, {
            namespace: name, available: [{ fullName: `${name}.Value`, code }], existing: [],
        }, { path: [], npmName: '' });
    };
    await write('Source', external, {}, 'globalThis.source = 7;');
    await write('Source', local, {}, 'globalThis.source = 2;');

    const manager = Object.create(DependencyManager.prototype);
    manager.path = root;
    manager.predefinedPaths = { 'Aventus@Main': join(root, 'Aventus@Main.package.avt') };
    manager.predefinedNpm = {};
    const readPackage = (name, uri, path) => {
        const file = Object.create(AventusPackageFile.prototype);
        file._file = { uri, contentUser: readFileSync(path, 'utf8') };
        file.version = { major: 0, minor: 0, patch: 0 };
        const sections = file.separeSection();
        assert.ok(sections);
        file.name = name;
        file.dependencies = JSON.parse(sections.depsTxt);
        file.srcInfo = JSON.parse(sections.jsSrc);
        file.loadWebComponents = () => {};
        return file;
    };
    manager.loadByUri = async (_build, uri) => {
        if (uri === pathToUri(manager.predefinedPaths['Aventus@Main'])) {
            return { name: 'Aventus@Main', dependencies: {}, file: { uri, contentUser: '' }, loadWebComponents() {} };
        }
        const path = [external, consumer].find(candidate => pathToUri(candidate) === uri);
        assert.ok(path, `unexpected package URI: ${uri}`);
        return readPackage(path === consumer ? 'Consumer' : 'Source', uri, path);
    };
    manager.loadLocal = async name => {
        assert.equal(name, 'Source');
        const uri = pathToUri(local);
        return { uri, file: readPackage(name, uri, local) };
    };
    const resolve = async dependency => {
        await write('Consumer', consumer, { Source: dependency },
            'globalThis.answer = globalThis.source + 1;');
        const result = await manager.loadDependenciesFromBuild({ dependencies: {
            Consumer: { uri: consumer, version: '1.0.0', include: 'full' },
        } }, { buildConfig: {} });
        const context = {};
        for (const file of result.files) {
            for (const item of file.srcInfo?.available ?? []) runInNewContext(item.code, context);
        }
        return { result, context };
    };

    const first = await resolve({ isLocal: true, version: '1.0.0', include: 'full' });
    assert.deepEqual(first.result.files.map(file => file.name), ['Aventus@Main', 'Source', 'Consumer']);
    assert.deepEqual(first.result.dependencyFullUris, [pathToUri(local), pathToUri(consumer)]);
    assert.equal(first.context.answer, 3);

    const second = await resolve({ uri: external, version: '1.0.0', include: 'full' });
    assert.deepEqual(second.result.dependencyFullUris, [pathToUri(external), pathToUri(consumer)]);
    assert.equal(second.context.answer, 8);

    await write('Source', local, {}, 'globalThis.source = 11;');
    const third = await resolve({ isLocal: true, version: '1.0.0', include: 'full' });
    assert.deepEqual(third.result.dependencyFullUris, [pathToUri(local), pathToUri(consumer)]);
    assert.equal(third.context.answer, 12);
    assert.equal(readFileSync(local, 'utf8').includes('globalThis.source = 11;'), true);
    assert.equal(readFileSync(local, 'utf8').includes('globalThis.source = 2;'), false);
});
