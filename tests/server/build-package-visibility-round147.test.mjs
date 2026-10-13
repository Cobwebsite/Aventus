import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { DependencyManager }, { AventusPackageFile }] = await loadServerModules([
    'project/Build.ts', 'project/DependencyManager.ts', 'language-services/ts/package/File.ts',
]);

test('package documentation preserves global declarations and hidden module declarations separately', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.package-visibility-round147-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousManager = DependencyManager.instance;
    DependencyManager.instance = { getPath: () => root };
    t.after(() => { DependencyManager.instance = previousManager; });
    const build = Object.create(Build.prototype);
    build.buildConfig = {
        fullname: 'Visibility@web', module: 'Visibility', name: 'web', version: '1.0.0',
        rawDependencies: {},
    };
    build.scssLanguageService = { getInternalDocumentation: () => ({}) };
    build.writeFile = async (path, content) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
    };
    const output = join(root, 'dist', 'Visibility.package.avt');
    await build.writeBuildDocumentation([output], {
        doc: ['export class PublicWidget {}'],
        docNoNamespace: ['interface Window { widgetReady: boolean }'],
        docInvisible: ['export class InternalWidget {}'],
        stylesheets: {}, htmlDoc: {}, codeRenderInJs: [], codeNotRenderInJs: [],
    }, { namespace: 'Visibility', available: [], existing: [] }, { path: [], npmName: '' });

    const content = readFileSync(output, 'utf8');
    const pkg = Object.create(AventusPackageFile.prototype);
    pkg._file = { contentUser: content };
    pkg.version = { major: 0, minor: 0, patch: 0 };
    const sections = pkg.separeSection();
    assert.match(sections.jsDef, /namespace Visibility\{[\s\S]*export class PublicWidget/);
    assert.match(sections.jsDef, /interface Window \{ widgetReady: boolean \}/);
    assert.match(sections.jsDef, /declare module ___Visibility \{[\s\S]*InternalWidget/);
    assert.doesNotMatch(content, /^\/\/ npm:/m);
    assert.equal(readFileSync(join(root, '@locals', 'Visibility@web.package.avt'), 'utf8'), content);
});
