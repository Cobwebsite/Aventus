import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { loadRuntime, loadRuntimeContext } from './helpers/load-runtime.mjs';

test('Converter restores registered classes in nested arrays and leaves unknown types as plain data', () => {
    const { Converter } = loadRuntime();
    class Item { constructor() { this.value = 0; } }
    Converter.register('test.Item', Item);
    const output = Converter.transform({ items: [{ $type: 'test.Item', value: 7 }, { $type: 'unknown', value: 8 }] });
    assert.equal(output.items[0] instanceof Item, true);
    assert.equal(output.items[0].value, 7);
    assert.equal(output.items[1] instanceof Item, false);
    assert.equal(output.items[1].value, 8);
    assert.equal(Converter.transform(null), null);
});

test('Converter copies writable values and inherited setter properties with filters', () => {
    const { Converter } = loadRuntime();
    class Parent { set label(value) { this._label = value; } get label() { return this._label; } }
    class Item extends Parent { constructor(value, label) { super(); this.value = value; this._label = label; this.skip = 1; } }
    const target = new Item(0, 'old');
    Converter.copyValuesClass(target, new Item(4, 'new'), {
        isValidKey: key => key !== 'skip' && key !== '_label',
        transformValue: (key, value) => key === 'value' ? value * 2 : value,
    });
    assert.equal(target.value, 8);
    assert.equal(target.label, 'new');
    assert.equal(target.skip, 1);
});

test('Converter restores serialized Maps and recursively transforms their values', () => {
    const context = loadRuntimeContext();
    const { Converter } = context.Aventus;
    const input = runInNewContext('({ $type: "Aventus.Map", values: [["one", { count: 1 }], ["two", [2, 3]]] })', context);
    const map = Converter.transform(input);
    assert.equal(map instanceof runInNewContext('Map', context), true);
    assert.equal(map.size, 2);
    assert.equal(map.get('one').count, 1);
    assert.deepEqual(Array.from(map.get('two')), [2, 3]);
});

test('clone produces an independent nested plain value', () => {
    const { clone } = loadRuntime();
    const source = { child: { value: 1 }, items: [1, 2] };
    const copy = clone(source);
    assert.notEqual(copy, source);
    assert.notEqual(copy.child, source.child);
    copy.child.value = 2;
    copy.items.push(3);
    assert.deepEqual(source, { child: { value: 1 }, items: [1, 2] });
});

test('Converter preserves nested unknown type markers while copying their values', () => {
    const { Converter } = loadRuntime();
    const source = { rows: [{ child: { $type: 'missing.Type', count: 3 } }] };
    const converted = Converter.transform(source);
    assert.notEqual(converted, source);
    assert.notEqual(converted.rows[0].child, source.rows[0].child);
    assert.equal(converted.rows[0].child.$type, 'missing.Type');
    assert.equal(converted.rows[0].child.count, 3);
});

test('clone propagates JSON serialization errors for cyclic and BigInt input', () => {
    const { clone } = loadRuntime();
    const cyclic = {}; cyclic.self = cyclic;
    assert.throws(() => clone(cyclic), error => error?.name === 'TypeError');
    assert.throws(() => clone({ id: 1n }), error => error?.name === 'TypeError');
});

test('Converter currently reduces a native Date to an empty plain object', () => {
    const { Converter } = loadRuntime();
    const date = new Date('2020-01-02T03:04:05.000Z');
    const converted = Converter.transform(date);
    assert.equal(converted instanceof Date, false);
    assert.deepEqual(Object.keys(converted), []);
});

test('Converter applies Data static schemas to boolean and numeric fields', () => {
    const { Converter, Data } = loadRuntime();
    class Record extends Data {
        static $schema = { enabled: 'boolean', count: 'number' };
        constructor() { super(); this.enabled = false; this.count = 0; }
    }
    Converter.register('test.Record', Record);
    const result = Converter.transform({ $type: 'test.Record', enabled: 1, count: '42' });
    assert.equal(result instanceof Record, true);
    assert.equal(result.enabled, true);
    assert.equal(result.count, 42);
});

test('Converter applies registered schemas to ordinary classes', () => {
    const { Converter } = loadRuntime();
    class Record { constructor() { this.count = 0; } }
    Converter.register('test.RegisteredSchema', Record, { count: 'number' });
    const result = Converter.transform({ $type: 'test.RegisteredSchema', count: '42' });
    assert.equal(result instanceof Record, true);
    assert.equal(result.count, 42);
});

test('Converter gives registered fields priority and falls back to the Data static schema', () => {
    const { Converter, Data } = loadRuntime();
    class Record extends Data {
        static $schema = { count: 'boolean', enabled: 'boolean', label: 'number' };
        constructor() { super(); this.count = false; this.enabled = false; this.label = 0; }
    }
    Converter.register('test.SchemaPriority', Record, { count: 'number', label: 'string' });
    const result = Converter.transform({ $type: 'test.SchemaPriority', count: '42', enabled: 1, label: 7 });
    assert.equal(result.count, 42);
    assert.equal(result.enabled, true);
    assert.equal(result.label, '7');
});
