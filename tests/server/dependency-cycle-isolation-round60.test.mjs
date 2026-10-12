import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('a cyclic package graph overflows ordering, then the same manager resolves a corrected graph', () => {
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
        let cycle;
        try {
            await manager.loadDependenciesFromBuild(config, build);
            cycle = { rejected: false };
        } catch (error) {
            cycle = { rejected: true, name: error.name, message: error.message };
        }
        packages.B.dependencies = {};
        const recovered = await manager.loadDependenciesFromBuild(config, build);
        process.stdout.write(JSON.stringify({ cycle, recovered: recovered.files.map(file => file.name) }));
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
    assert.deepEqual(actual.cycle, { rejected: true, name: 'RangeError', message: 'Maximum call stack size exceeded' });
    assert.deepEqual(actual.recovered, ['Aventus@Main', 'B', 'A']);
});
