import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Build }, { DependencyManager }, { AventusPackageFile }] = await loadServerModules([
    'project/Build.ts', 'project/DependencyManager.ts', 'language-services/ts/package/File.ts',
]);

function setup(t, root) {
    const oldDependency = DependencyManager.instance;
    DependencyManager.instance = { getPath: () => root };
    t.after(() => { DependencyManager.instance = oldDependency; });
    const build = Object.create(Build.prototype);
    build.buildRevision = 0;
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

test('multiple package destinations and local cache reflect the latest API sections', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-package-multiple-destinations-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const build = setup(t, root);
    const first = join(root, 'dist', 'first.package.avt');
    const second = join(root, 'other', 'second.package.avt');
    const srcA = { namespace: 'Catalog', available: [{ name: 'First' }], existing: [] };
    const srcB = { namespace: 'Catalog', available: [{ name: 'Second' }], existing: [] };

    await build.writeBuildDocumentation([first, '', second], result({
        doc: ['export class First {}'],
        docNoNamespace: ['declare const globalFirst: string;'],
        docInvisible: ['export class InternalFirst {}'],
    }), srcA, { path: [], npmName: '' });
    assert.equal(readFileSync(first, 'utf8'), readFileSync(second, 'utf8'));
    assert.deepEqual(JSON.parse(sections(first).jsSrc), srcA);
    assert.match(sections(first).jsDef, /globalFirst/);
    assert.match(sections(first).jsDef, /InternalFirst/);

    await build.writeBuildDocumentation([first, '', second], result({
        doc: ['export class Second {}'],
    }), srcB, { path: [], npmName: '' });
    const current = readFileSync(first, 'utf8');
    assert.equal(readFileSync(second, 'utf8'), current);
    assert.equal(readFileSync(join(root, '@locals', 'Catalog@web.package.avt'), 'utf8'), current);
    assert.deepEqual(JSON.parse(sections(second).jsSrc), srcB);
    assert.match(sections(second).jsDef, /Second/);
    assert.doesNotMatch(sections(second).jsDef, /First|globalFirst|InternalFirst/);
});

test('default npm name follows the current module and build name across package writes', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-package-default-npm-name-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const build = setup(t, root);
    const path = join(root, 'dist', 'Catalog.package.avt');
    const src = { namespace: 'Catalog', available: [], existing: [] };
    await build.writeBuildDocumentation([path], result(), src, { path: [join(root, 'npm')], npmName: '' });
    assert.match(readFileSync(path, 'utf8'), /^\/\/ npm:@catalog\/web$/m);

    build.buildConfig.module = 'NewCatalog';
    build.buildConfig.name = 'Mobile';
    build.buildConfig.fullname = 'NewCatalog@Mobile';
    await build.writeBuildDocumentation([path], result(), src, { path: [join(root, 'npm')], npmName: '' });
    const current = readFileSync(path, 'utf8');
    assert.match(current, /^\/\/ npm:@newcatalog\/mobile$/m);
    assert.doesNotMatch(current, /@catalog\/web/);
    assert.equal(readFileSync(join(root, '@locals', 'NewCatalog@Mobile.package.avt'), 'utf8'), current);
});
