import assert from 'node:assert/strict';
import test from 'node:test';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }, { AventusJSONLanguageService }] = await loadServerModules([
    'project/Project.ts', 'language-services/json/LanguageService.ts',
]);

test('project validation locates a dependency cycle on the matching config key and clears it after repair', async t => {
    const previous = AventusJSONLanguageService.getInstance;
    const config = { uri: 'file:///workspace/aventus.conf.avt' };
    const range = { start: { line: 8, character: 17 }, end: { line: 8, character: 29 } };
    const baseDiagnostic = { message: 'base schema error', range };
    const calls = [];
    AventusJSONLanguageService.getInstance = () => ({
        validate: async file => { assert.equal(file, config); return [baseDiagnostic]; },
        getDependencyKeyRange: (file, build, dependency) => {
            calls.push([file, build, dependency]);
            return build === 'web' && dependency === 'LibraryB' ? range : null;
        },
    });
    t.after(() => { AventusJSONLanguageService.getInstance = previous; });

    const project = Object.create(Project.prototype);
    const web = { buildConfig: { name: 'web' }, dependencyCycle: ['LibraryA', 'LibraryB', 'LibraryA'] };
    const other = { buildConfig: { name: 'other' }, dependencyCycle: ['MissingA', 'MissingB'] };
    Object.assign(project, { configFile: config, builds: [web, other] });

    const withCycle = await project.onValidate();
    assert.equal(withCycle.length, 2);
    assert.equal(withCycle[0], baseDiagnostic);
    assert.deepEqual(withCycle[1], {
        range,
        severity: DiagnosticSeverity.Error,
        source: 'Aventus',
        message: 'Cycle de dépendances : LibraryA → LibraryB → LibraryA',
    });
    assert.ok(calls.some(([file, build, dependency]) =>
        file === config && build === 'web' && dependency === 'LibraryB'));

    web.dependencyCycle = undefined;
    other.dependencyCycle = undefined;
    assert.deepEqual(await project.onValidate(), [baseDiagnostic]);
});

test('cycle validation uses the real JSON dependency key range after a config edit', async t => {
    const service = AventusJSONLanguageService.getInstance();
    const previousValidate = service.validate;
    service.validate = async () => [];
    t.after(() => { service.validate = previousValidate; });
    const uri = 'file:///workspace/aventus.conf.avt';
    const file = { documentUser: TextDocument.create(uri, 'json', 1, JSON.stringify({
        module: 'Demo', build: [{ name: 'web', src: [],
            dependencies: { LibraryA: 'a.package.avt', LibraryB: 'b.package.avt' } }],
    }, null, 2)) };
    const project = Object.create(Project.prototype);
    const build = { buildConfig: { name: 'web' }, dependencyCycle: ['LibraryA', 'LibraryB', 'LibraryA'] };
    Object.assign(project, { configFile: file, builds: [build] });

    const [diagnostic] = await project.onValidate();
    assert.equal(file.documentUser.getText(diagnostic.range), '"LibraryA"');
    assert.equal(diagnostic.severity, DiagnosticSeverity.Error);

    file.documentUser = TextDocument.create(uri, 'json', 2, JSON.stringify({
        module: 'Demo', build: [{ name: 'web', src: [], dependencies: {
            Unrelated: 'other.package.avt', LibraryB: 'b.package.avt',
        } }],
    }, null, 2));
    const [shifted] = await project.onValidate();
    assert.equal(file.documentUser.getText(shifted.range), '"LibraryB"');
    assert.notDeepEqual(shifted.range, diagnostic.range);

    build.dependencyCycle = undefined;
    assert.deepEqual(await project.onValidate(), []);
});
