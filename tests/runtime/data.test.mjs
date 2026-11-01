import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('Data exposes type metadata, serializes values and clones through Converter', () => {
    const { Data, Converter } = loadRuntime();
    class Record extends Data {
        static Namespace = 'Tests';
        constructor() { super(); this.id = 1; this.label = 'first'; }
    }
    Converter.register(Record.Fullname, Record);
    const record = new Record();
    assert.equal(record.namespace, 'Tests');
    assert.equal(record.$type, 'Tests.Record');
    assert.equal(record.className, 'Record');
    const json = record.toJSON();
    assert.equal(json.id, 1);
    assert.equal(json.label, 'first');
    assert.equal(json.$type, 'Tests.Record');
    assert.equal(Object.hasOwn(json, 'namespace'), false);
    const copy = record.clone();
    assert.equal(copy instanceof Record, true);
    assert.notEqual(copy, record);
    copy.label = 'second';
    assert.equal(record.label, 'first');
});
