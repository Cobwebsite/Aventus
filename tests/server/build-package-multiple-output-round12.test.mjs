import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { DependencyManager }, { SettingsManager }, { AventusPackageFile }] =
    await loadServerModules([
        'project/Build.ts', 'project/DependencyManager.ts', 'settings/Settings.ts',
        'language-services/ts/package/File.ts',
    ]);

test('package generation synchronizes multiple configured outputs and its local cache after a rebuild', async t => {
    const root = mkdtempSync(join(import.meta.dirname, '.package-multi-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    DependencyManager.instance = { getPath: () => root };
    SettingsManager.instance = { settings: { useStats: false } };
    const build = Object.create(Build.prototype);
    build.buildConfig = {
        fullname: 'Catalog@front', module: 'Catalog', name: 'front', version: '2.1.0',
        rawDependencies: {},
    };
    build.scssLanguageService = { getInternalDocumentation: () => ({ variables: ['brand'] }) };
    const outputs = [join(root, 'dist', 'one.package.avt'), join(root, 'mirror', 'two.package.avt')];
    const local = join(root, '@locals', 'Catalog@front.package.avt');
    const write = (className, src) => build.writeBuildDocumentation(outputs, {
        doc: [`export class ${className} {}`], docNoNamespace: [], docInvisible: [],
        stylesheets: {}, htmlDoc: {}, codeRenderInJs: [], codeNotRenderInJs: [],
    }, { namespace: 'Catalog', available: [{ name: className }], existing: [], source: src },
    { path: [join(root, 'npm')], npmName: '' });

    await write('OldItem', 'old');
    await write('NewItem', 'new');
    const contents = [...outputs, local].map(path => readFileSync(path, 'utf8'));
    assert.equal(contents[0], contents[1]);
    assert.equal(contents[1], contents[2]);
    assert.match(contents[0], /^\/\/ npm:@catalog\/front$/m);
    assert.match(contents[0], /export class NewItem/);
    assert.doesNotMatch(contents[0], /OldItem|old/);
    const packageFile = Object.create(AventusPackageFile.prototype);
    packageFile._file = { contentUser: contents[0] };
    packageFile.version = { major: 0, minor: 0, patch: 0 };
    const sections = packageFile.separeSection();
    assert.equal(packageFile.name, 'Catalog@front');
    assert.deepEqual(JSON.parse(sections.jsSrc).available, [{ name: 'NewItem' }]);
});
