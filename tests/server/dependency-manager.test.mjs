import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ DependencyManager }, { GenericServer }] = await loadServerModules([
    'project/DependencyManager.ts', 'GenericServer.ts',
]);

function manager() {
    const instance = Object.create(DependencyManager.prototype);
    instance.loadedPackages = {};
    return instance;
}

test('dependency versions parse fixed and wildcard components', () => {
    const instance = manager();
    assert.deepEqual(instance.parseVersion('1.2.3'), { major: 1, minor: 2, patch: 3 });
    assert.deepEqual(instance.parseVersion('1.x.X'), { major: 1, minor: -1, patch: -1 });
    assert.deepEqual(instance.parseVersion('x.x.x'), { major: -1, minor: -1, patch: -1 });
});

test('dependency version conflicts report the package and preserve the selected version', () => {
    const instance = manager();
    const errors = [];
    GenericServer.instance = { logLevel: 0, connection: { showErrorMessage: message => errors.push(message) } };
    const fixed = { major: 1, minor: 2, patch: 3 };
    const wildcard = { major: 1, minor: -1, patch: -1 };
    assert.equal(instance.compareVersion(fixed, wildcard, 'Acme'), fixed);
    assert.equal(instance.compareVersion(wildcard, fixed, 'Acme'), fixed);
    assert.equal(instance.compareVersion(fixed, { ...fixed }, 'Acme'), fixed);
    assert.equal(instance.compareVersion(fixed, { major: 2, minor: 0, patch: 0 }, 'Acme'), null);
    assert.match(errors[0], /dependency Acme/);
});

test('dependency order places transitive packages before their consumers', () => {
    const instance = manager();
    const graph = {
        app: { dependencies: [{ name: 'ui' }, { name: 'util' }] },
        ui: { dependencies: [{ name: 'util' }] },
        util: { dependencies: [] },
    };
    const ordered = [];
    for (const [name, dependency] of Object.entries(graph)) {
        instance.orderLoop(name, dependency, graph, ordered);
    }
    assert.equal(new Set(ordered).size, 3);
    assert.ok(ordered.indexOf('util') < ordered.indexOf('ui'));
    assert.ok(ordered.indexOf('ui') < ordered.indexOf('app'));
});

test('dependency manager exposes loaded packages without allowing caller mutation', () => {
    const instance = manager();
    const pkg = { name: 'local' };
    instance.loadedPackages.local = pkg;
    const packages = instance.packages;
    assert.deepEqual(packages, [pkg]);
    packages.pop();
    assert.deepEqual(instance.packages, [pkg]);
});
