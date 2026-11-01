import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { loadRuntime, loadRuntimeContext } from './helpers/load-runtime.mjs';

test('compareObject compares nested values and ordered or unordered arrays', () => {
    const { compareObject } = loadRuntime();
    assert.equal(compareObject({ item: { count: 2 } }, { item: { count: 2 } }), true);
    assert.equal(compareObject({ item: { count: 2 } }, { item: { count: 3 } }), false);
    assert.equal(compareObject([1, 2], [2, 1]), false);
    assert.equal(compareObject([1, 2], [2, 1], false), true);
    assert.equal(compareObject([1, 1], [1, 2], false), false);
    assert.equal(compareObject([1], { 0: 1 }), false);
    assert.equal(compareObject(null, {}), false);
});

test('compareObject does not mutate unordered input arrays', () => {
    const { compareObject } = loadRuntime();
    const left = [{ id: 1 }, { id: 2 }];
    const right = [{ id: 2 }, { id: 1 }];
    assert.equal(compareObject(left, right, false), true);
    assert.deepEqual(right, [{ id: 2 }, { id: 1 }]);
});

test('compareObject currently treats equal-size Maps with different values as equal', () => {
    const context = loadRuntimeContext();
    const { compareObject } = context.Aventus;
    const left = runInNewContext('new Map([["one", 1], ["two", 2]])', context);
    const same = runInNewContext('new Map([["one", 1], ["two", 2]])', context);
    const different = runInNewContext('new Map([["one", 1], ["two", 3]])', context);
    assert.equal(compareObject(left, same), true);
    assert.equal(compareObject(left, different), true);
});

test('compareObject rejects Maps of different sizes', () => {
    const context = loadRuntimeContext();
    const { compareObject } = context.Aventus;
    const one = runInNewContext('new Map([["one", 1]])', context);
    const two = runInNewContext('new Map([["one", 1], ["two", 2]])', context);
    assert.equal(compareObject(one, two), false);
});

test('compareObject currently treats native Dates with different timestamps as equal', () => {
    const { compareObject } = loadRuntime();
    assert.equal(compareObject(new Date('2020-01-01'), new Date('2020-01-01')), true);
    assert.equal(compareObject(new Date('2020-01-01'), new Date('2021-01-01')), true);
});

test('compareObject handles an identical cyclic reference but overflows on separate cycles', () => {
    const { compareObject } = loadRuntime();
    const same = {}; same.self = same;
    const other = {}; other.self = other;
    assert.equal(compareObject(same, same), true);
    assert.throws(() => compareObject(same, other), error => error?.name === 'RangeError');
});

test('compareObject currently treats a Watcher proxy and matching plain data as different', () => {
    const context = loadRuntimeContext();
    const { compareObject, Watcher } = context.Aventus;
    const model = Watcher.get(runInNewContext('({ child: { count: 1 } })', context));
    const before = runInNewContext('({ child: { count: 1 } })', context);
    const after = runInNewContext('({ child: { count: 2 } })', context);
    assert.equal(compareObject(model, before), false);
    model.child.count = 2;
    assert.equal(compareObject(model, before), false);
    assert.equal(compareObject(model, after), false);
});
