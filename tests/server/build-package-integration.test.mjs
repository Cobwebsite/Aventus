import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { DependencyManager }, { SettingsManager }, { AventusPackageFile }] = await loadServerModules([
    'project/Build.ts', 'project/DependencyManager.ts', 'settings/Settings.ts',
    'language-services/ts/package/File.ts',
]);

function fixture(t) {
    const root = mkdtempSync(join(import.meta.dirname, '.build-package-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    DependencyManager.instance = { getPath: () => root };
    SettingsManager.instance = { settings: { useStats: false } };
    const build = Object.create(Build.prototype);
    build.buildConfig = {
        fullname: 'Demo@web', module: 'Demo', name: 'web', version: '1.2.3',
        description: 'Sample package', rawDependencies: { 'Shared@base': { version: '1.0.0' } },
    };
    build.scssLanguageService = { getInternalDocumentation: () => ({ colors: ['brand'] }) };
    const output = join(root, 'dist', 'Demo.package.avt');
    return { build, root, output };
}

function compileInfo(doc = 'export class Widget {}') {
    return {
        doc: [doc], docNoNamespace: [], docInvisible: [],
        stylesheets: { Widget: '.widget{color:red}' }, htmlDoc: { Widget: '<div></div>' },
        codeRenderInJs: [], codeNotRenderInJs: [],
    };
}

test('build writes a parseable Aventus package to configured and local output paths', async t => {
    const { build, root, output } = fixture(t);
    const info = compileInfo();
    await build.writeBuildDocumentation([output], info, {
        namespace: 'Demo', available: [], existing: [],
    }, { path: [join(root, 'npm')], npmName: '@demo/web' });

    const content = readFileSync(output, 'utf8');
    assert.equal(readFileSync(join(root, '@locals', 'Demo@web.package.avt'), 'utf8'), content);
    assert.match(content, /^\/\/ Demo@web:1\.2\.3/m);
    assert.match(content, /^\/\/ npm:@demo\/web/m);
    assert.match(content, /\/\* description:Sample package \*\//);
    assert.match(content, /declare global \{/);
    assert.match(content, /export class Widget \{\}/);
    for (const section of ['js def', 'js src', 'css def', 'css', 'html', 'dependencies']) {
        assert.match(content, new RegExp(`//#region ${section} //`));
        assert.match(content, new RegExp(`//#endregion ${section} //`));
    }
    assert.match(content, /"Shared@base"/);
    assert.ok(content.includes('"Widget":".widget{color:red}"'));
    assert.deepEqual(AventusPackageFile.getQuickInfo({ contentUser: content }), {
        name: 'Demo@web', version: { major: 1, minor: 2, patch: 3 },
    });
    const packageFile = Object.create(AventusPackageFile.prototype);
    packageFile._file = { contentUser: content };
    packageFile.version = { major: 0, minor: 0, patch: 0 };
    const sections = packageFile.separeSection();
    assert.equal(packageFile.name, 'Demo@web');
    assert.deepEqual(packageFile.version, { major: 1, minor: 2, patch: 3 });
    assert.deepEqual(JSON.parse(sections.jsSrc), { namespace: 'Demo', available: [], existing: [] });
    assert.deepEqual(JSON.parse(sections.scssTxt), { Widget: '.widget{color:red}' });
    assert.deepEqual(JSON.parse(sections.depsTxt), { 'Shared@base': { version: '1.0.0' } });
});

test('package rebuild replaces the previous documentation in both outputs', async t => {
    const { build, root, output } = fixture(t);
    const write = doc => build.writeBuildDocumentation([output], compileInfo(doc), {
        namespace: 'Demo', available: [], existing: [],
    }, { path: [], npmName: '', live: false });
    await write('export class OldWidget {}');
    await write('export class NewWidget {}');

    for (const path of [output, join(root, '@locals', 'Demo@web.package.avt')]) {
        const content = readFileSync(path, 'utf8');
        assert.match(content, /NewWidget/);
        assert.doesNotMatch(content, /OldWidget/);
    }
});

test('package generation can retry after a non-retryable output write failure', async t => {
    const { build, root, output } = fixture(t);
    mkdirSync(output, { recursive: true }); // A directory blocks writing a file at this path.
    const write = () => build.writeBuildDocumentation([output], compileInfo(), {
        namespace: 'Demo', available: [], existing: [],
    }, { path: [], npmName: '', live: false });
    await assert.rejects(write, { code: 'EISDIR' });
    rmSync(output, { recursive: true });
    await write();
    assert.match(readFileSync(output, 'utf8'), /export class Widget/);
    assert.match(readFileSync(join(root, '@locals', 'Demo@web.package.avt'), 'utf8'), /export class Widget/);
});
