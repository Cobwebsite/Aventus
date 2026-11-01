import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('Json serializes own values and inherited getters with filters and transformations', () => {
    const { Json } = loadRuntime();
    class Parent { get doubled() { return this.count * 2; } }
    class Model extends Parent { constructor() { super(); this.count = 3; this.secret = 'hidden'; } }
    const result = Json.classToJson(new Model(), {
        isValidKey: key => key !== 'secret' && key !== 'constructor',
        replaceKey: key => key.toUpperCase(),
        transformValue: (key, value) => key === 'count' ? value + 1 : value,
        beforeEnd: value => ({ ...value, READY: true }),
    });
    assert.deepEqual({ ...result }, { COUNT: 4, DOUBLED: 6, READY: true });
});

test('Json restores writable properties and inherited setters while controlling undefined', () => {
    const { Json } = loadRuntime();
    class Parent { set label(value) { this._label = value; } get label() { return this._label; } }
    class Model extends Parent { constructor() { super(); this.count = 1; this._label = 'old'; } }
    const model = new Model();
    Json.classFromJson(model, { Count: 4, label: 'new', extra: 9 });
    assert.equal(model.count, 4);
    assert.equal(model.label, 'new');
    assert.equal(Object.hasOwn(model, 'extra'), false);
    Json.classFromJson(model, { count: undefined }, { replaceUndefinedWithKey: true });
    assert.equal(model.count, undefined);
});

test('Json leaves readonly fields intact and replaces omitted fields only when requested', () => {
    const { Json } = loadRuntime();
    const model = { keep: 'old', clear: 'old' };
    Object.defineProperty(model, 'locked', { value: 'fixed', writable: false, enumerable: true });
    Json.classFromJson(model, { keep: 'new', locked: 'changed' });
    assert.equal(model.keep, 'new');
    assert.equal(model.clear, 'old');
    assert.equal(model.locked, 'fixed');
    Json.classFromJson(model, {}, { replaceUndefined: true });
    assert.equal(model.keep, undefined);
    assert.equal(model.clear, undefined);
    assert.equal(model.locked, 'fixed');
});

test('Json rejects null source and null input data without changing a populated target', () => {
    const { Json } = loadRuntime();
    assert.throws(() => Json.classToJson(null), error => error?.name === 'TypeError');
    const model = { value: 4 };
    assert.throws(() => Json.classFromJson(model, null), error => error?.name === 'TypeError');
    assert.equal(model.value, 4);
});

test('Json rename collisions keep the later property and use original keys for transforms', () => {
    const { Json } = loadRuntime();
    const transformed = [];
    const result = Json.classToJson({ first: 1, second: 2 }, {
        isValidKey: key => key === 'first' || key === 'second',
        replaceKey: () => 'shared',
        transformValue: (key, value) => { transformed.push(key); return value * 10; }
    });
    assert.equal(result.shared, 20);
    assert.deepEqual(transformed, ['first', 'second']);
    assert.deepEqual(Object.keys(result), ['shared']);
});

test('Json prefers exact data keys over capitalized aliases', () => {
    const { Json } = loadRuntime();
    const model = { count: 0 };
    Json.classFromJson(model, { count: 3, Count: 9 });
    assert.equal(model.count, 3);
    Json.classFromJson(model, { count: undefined, Count: 9 });
    assert.equal(model.count, 3);
    Json.classFromJson(model, { count: undefined, Count: 9 }, { replaceUndefinedWithKey: true });
    assert.equal(model.count, undefined);
    Json.classFromJson(model, { Count: 9 });
    assert.equal(model.count, 9);
});
