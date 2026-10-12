import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }] = await loadServerModules(['project/Project.ts']);

test('project validation underlines the configured dependency and clears a resolved cycle', async () => {
    const documentUser = TextDocument.create('file:///project/aventus.conf.avt', 'json', 1,
        '{"dependencies":{"A":{"uri":"/A.package.avt"}},"build":[{"name":"App","dependencies":{"C":{"uri":"/C.package.avt"}}}]}');
    const project = Object.create(Project.prototype);
    project.configFile = { documentUser };
    const rootBuild = { buildConfig: { name: 'App' }, dependencyCycle: ['A', 'B', 'A'] };
    const localBuild = { buildConfig: { name: 'App' }, dependencyCycle: ['C', 'D', 'C'] };
    project.builds = [rootBuild, localBuild];

    const diagnostics = await project.onValidate();
    const cycleDiagnostics = diagnostics.filter(item => item.message.startsWith('Cycle de dépendances'));
    assert.deepEqual(cycleDiagnostics.map(item => item.message), [
        'Cycle de dépendances : A → B → A', 'Cycle de dépendances : C → D → C',
    ]);
    assert.deepEqual(cycleDiagnostics.map(item => documentUser.getText(item.range)), ['"A"', '"C"']);

    rootBuild.dependencyCycle = null;
    localBuild.dependencyCycle = null;
    assert.equal((await project.onValidate()).some(item => item.message.startsWith('Cycle de dépendances')), false);
});

test('a cyclic package graph reports the cycle, then the same manager resolves a corrected graph', () => {
    const loader = new URL('./helpers/load-ts.mjs', import.meta.url).href;
    const script = `
        import { loadServerModules } from ${JSON.stringify(loader)};
        const [{ DependencyManager }, { ManifestPackage }, { GenericServer }] = await loadServerModules([
            'project/DependencyManager.ts', 'manifest/ManifestPackage.ts', 'GenericServer.ts',
        ]);
        const packages = {
            'Aventus@Main': { dependencies: {} },
            A: { dependencies: { B: { uri: '/B.package.avt' } } },
            B: { dependencies: { A: { uri: '/A.package.avt' } } },
        };
        const manager = Object.create(DependencyManager.prototype);
        manager.predefinedPaths = { 'Aventus@Main': '/Aventus@Main.package.avt' };
        manager.predefinedNpm = {};
        manager.loadByUri = async (_build, uri) => {
            const name = decodeURIComponent(uri).split('/').at(-1).replace('.package.avt', '');
            const source = packages[name];
            if (!source) return undefined;
            return { name, dependencies: source.dependencies, file: { uri, contentUser: '' }, loadWebComponents() {} };
        };
        ManifestPackage.files = {};
        ManifestPackage.done = false;
        GenericServer.instance = { logLevel: 0, connection: { showErrorMessage() {} } };
        const config = { dependencies: { A: { uri: '/A.package.avt' } } };
        const build = { buildConfig: {} };
        const cycleResult = await manager.loadDependenciesFromBuild(config, build);
        packages.B.dependencies = {};
        const recovered = await manager.loadDependenciesFromBuild(config, build);
        process.stdout.write(JSON.stringify({ cycle: cycleResult.cycle, cycleFiles: cycleResult.files.length, recovered: recovered.files.map(file => file.name) }));
    `;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
        cwd: fileURLToPath(new URL('../../', import.meta.url)),
        encoding: 'utf8',
        timeout: 15_000,
        maxBuffer: 1024 * 1024,
    });
    assert.equal(result.error, undefined, result.stderr);
    assert.equal(result.status, 0, result.stderr);
    const actual = JSON.parse(result.stdout);
    assert.deepEqual(actual.cycle, ['A', 'B', 'A']);
    assert.equal(actual.cycleFiles, 0);
    assert.deepEqual(actual.recovered, ['Aventus@Main', 'B', 'A']);
});
