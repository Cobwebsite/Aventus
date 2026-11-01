import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('Uri extracts named string and numeric segments and rejects mismatches', () => {
    const { Uri } = loadRuntime();
    const route = Uri.prepare('/users/{id:number}/files/{name}');
    assert.deepEqual({ ...Uri.getParams(route, '/users/42/files/report') }, { id: 42, name: 'report' });
    assert.equal(Uri.getParams(route, '/users/no/files/report'), null);
    assert.equal(Uri.getParams(route, '/users/42/files/report/extra'), null);
    assert.equal(Uri.isActive('/users/*', '/users/42'), true);
    assert.equal(Uri.isActive('/users/*', '/projects/42'), false);
});

test('Uri normalization removes dot segments and preserves absolute paths', () => {
    const { Uri } = loadRuntime();
    assert.equal(Uri.normalize('/one/./two/../three//'), '/one/three');
    assert.equal(Uri.normalize('one/../../two'), 'two');
    assert.equal(Uri.normalize('/'), '/');
});
