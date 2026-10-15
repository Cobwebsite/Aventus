import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { DependencyManager }, { AventusPackageFile }] = await loadServerModules([
    'project/Build.ts', 'project/DependencyManager.ts', 'language-services/ts/package/File.ts',
]);

function setup(t, root) {
    const oldDependency = DependencyManager.instance;
    DependencyManager.instance = { getPath: () => root };
    t.after(() => { DependencyManager.instance = oldDependency; });
    const build = Object.create(Build.prototype);
    build.buildConfig = {
        fullname: 'Catalog@web', module: 'Catalog', name: 'web', version: '3.2.1',
        rawDependencies: {},
    };
    build.scssLanguageService = { getInternalDocumentation: () => ({}) };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    return build;
}

function sections(path) {
    const pkg = Object.create(AventusPackageFile.prototype);
    pkg._file = { contentUser: readFileSync(path, 'utf8') };
    pkg.version = { major: 0, minor: 0, patch: 0 };
    return pkg.separeSection();
}

function result(overrides = {}) {
    return {
        doc: ['export class Card {}'], docNoNamespace: [], docInvisible: [],
        stylesheets: {}, htmlDoc: {}, codeRenderInJs: [], codeNotRenderInJs: [],
        ...overrides,
    };
}

test('generated package retains CSS and HTML documentation as separate readable sections', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-package-css-html-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const build = setup(t, root);
    const path = join(root, 'dist', 'Catalog.package.avt');
    const cssDocs = { '@theme': { variables: ['--brand'] } };
    const stylesheets = { '@theme': ':root{--brand:red}' };
    const htmlDoc = { 'catalog-card': { description: 'A card' } };
    build.scssLanguageService.getInternalDocumentation = () => cssDocs;

    await build.writeBuildDocumentation([path], result({ stylesheets, htmlDoc }), {
        namespace: 'Catalog', available: [], existing: [],
    }, { path: [], npmName: '' });
    const data = sections(path);
    assert.deepEqual(JSON.parse(data.scssDefTxt), cssDocs);
    assert.deepEqual(JSON.parse(data.scssTxt), stylesheets);
    assert.deepEqual(JSON.parse(data.htmlTxt), htmlDoc);
    assert.equal(readFileSync(join(root, '@locals', 'Catalog@web.package.avt'), 'utf8'), readFileSync(path, 'utf8'));
});

test('package header and dependency section follow a changed build configuration', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-package-config-revision-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const build = setup(t, root);
    const path = join(root, 'dist', 'Catalog.package.avt');
    const src = { namespace: 'Catalog', available: [], existing: [] };
    await build.writeBuildDocumentation([path], result(), src, { path: [], npmName: '' });
    assert.doesNotMatch(readFileSync(path, 'utf8'), /^\/\/ npm:/m);

    build.buildConfig.description = 'A catalog package';
    build.buildConfig.rawDependencies = { Shared: { version: '2.0.0', include: 'need' } };
    await build.writeBuildDocumentation([path], result(), src, {
        path: [join(root, 'npm')], npmName: '@example/catalog',
    });
    const content = readFileSync(path, 'utf8');
    assert.match(content, /^\/\/ Catalog@web:3\.2\.1$/m);
    assert.match(content, /^\/\/ npm:@example\/catalog$/m);
    assert.match(content, /\/\* description:A catalog package \*\//);
    assert.deepEqual(JSON.parse(sections(path).depsTxt), build.buildConfig.rawDependencies);
    assert.equal(readFileSync(join(root, '@locals', 'Catalog@web.package.avt'), 'utf8'), content);
});
