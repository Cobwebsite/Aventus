import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { DependencyManager } = await loadServerModule('project/DependencyManager.ts');

test('dependency loading orders packages and separates full, needed and excluded URIs', async () => {
    const manager = Object.create(DependencyManager.prototype);
    const loaded = [];
    const calls = [];
    const graph = {
        App: [{ name: 'Shared', include: 'need' }],
        Shared: [],
        Optional: [],
        'Aventus@Main': [],
    };
    manager.loadDependency = async (name, dependency, _config, _build, result) => {
        calls.push([name, dependency.include]);
        const file = { name, loadWebComponents: () => loaded.push(name) };
        result[name] = {
            file, uri: `file:///${name}.package.avt`, include: dependency.include ?? 'need',
            dependencies: graph[name],
        };
        return file;
    };

    const result = await manager.loadDependenciesFromBuild({ dependencies: {
        App: { include: 'full' },
        Shared: { include: 'need' },
        Optional: { include: 'none' },
    } }, { buildConfig: {} });

    assert.deepEqual(calls, [
        ['App', 'full'], ['Shared', 'need'], ['Optional', 'none'], ['Aventus@Main', 'need'],
    ]);
    assert.ok(loaded.indexOf('Shared') < loaded.indexOf('App'));
    assert.equal(new Set(loaded).size, 4);
    assert.deepEqual(result.files.map(file => file.name), loaded);
    assert.deepEqual(result.dependencyFullUris, ['file:///App.package.avt']);
    assert.ok(result.dependencyNeedUris.includes('file:///Shared.package.avt'));
    assert.ok(result.dependencyNeedUris.includes('file:///Aventus@Main.package.avt'));
    assert.equal(result.dependencyUris.includes('file:///Optional.package.avt'), false);
});

test('i18n builds request their runtime dependency even when not explicitly configured', async () => {
    const manager = Object.create(DependencyManager.prototype);
    const requested = [];
    manager.loadDependency = async (name, dependency, _config, _build, result) => {
        requested.push(name);
        const file = { name, loadWebComponents: () => {} };
        result[name] = { file, uri: `file:///${name}`, include: dependency.include, dependencies: [] };
        return file;
    };
    const result = await manager.loadDependenciesFromBuild({ dependencies: {} }, { buildConfig: { i18n: {} } });
    assert.deepEqual(requested, ['Aventus@Main', 'Aventus@I18n']);
    assert.deepEqual(new Set(result.files.map(file => file.name)), new Set(requested));
});
