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

test('compareObject compares Map keys and nested values without insertion order', () => {
    const context = loadRuntimeContext();
    const { compareObject } = context.Aventus;
    const left = runInNewContext('new Map([["one", { count: 1 }], ["two", 2]])', context);
    const same = runInNewContext('new Map([["two", 2], ["one", { count: 1 }]])', context);
    const different = runInNewContext('new Map([["one", { count: 3 }], ["two", 2]])', context);
    const otherKeys = runInNewContext('new Map([["one", { count: 1 }], ["three", 2]])', context);
    assert.equal(compareObject(left, same), true);
    assert.equal(compareObject(left, different), false);
    assert.equal(compareObject(left, otherKeys), false);
    assert.equal(compareObject(left, {}), false);
    assert.equal(compareObject({}, left), false);
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

test('compareObject compares cyclic structures without overflowing', () => {
    const { compareObject } = loadRuntime();
    const same = { value: 1 }; same.self = same;
    const other = { value: 1 }; other.self = other;
    const different = { value: 2 }; different.self = different;
    assert.equal(compareObject(same, same), true);
    assert.equal(compareObject(same, other), true);
    assert.equal(compareObject(same, different), false);
    const leftArray = []; leftArray.push(leftArray, 1);
    const rightArray = []; rightArray.push(rightArray, 1);
    assert.equal(compareObject(leftArray, rightArray), true);
});

test('compareObject compares Watcher proxy data with plain objects', () => {
    const context = loadRuntimeContext();
    const { compareObject, Watcher } = context.Aventus;
    const model = Watcher.get(runInNewContext('({ child: { count: 1 } })', context));
    const before = runInNewContext('({ child: { count: 1 } })', context);
    const after = runInNewContext('({ child: { count: 2 } })', context);
    assert.equal(compareObject(model, before), true);
    assert.equal(compareObject(before, model), true);
    model.child.count = 2;
    assert.equal(compareObject(model, before), false);
    assert.equal(compareObject(model, after), true);
    assert.equal(compareObject(model.child, after.child), true);
    assert.equal(Object.hasOwn(before, '__path'), false);
    assert.equal(Object.hasOwn(after, '__path'), false);
});

test('compareObject preserves Watcher paths and subsequent notifications', () => {
    const context = loadRuntimeContext();
    const { compareObject, Watcher } = context.Aventus;
    const paths = [];
    const model = Watcher.get(runInNewContext('({ child: { count: 1 } })', context), (_action, path) => paths.push(path));
    const plain = runInNewContext('({ child: { count: 1 } })', context);
    assert.equal(compareObject(model, plain), true);
    assert.equal(Watcher.extract(model.child, false).__path, 'child');
    model.child.count = 2;
    assert.equal(paths.includes('child.count'), true);
});
