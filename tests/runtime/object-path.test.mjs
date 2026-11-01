import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { loadRuntime, loadRuntimeContext } from './helpers/load-runtime.mjs';

test('object paths read dot and bracket notation and report absent segments', () => {
    const { getValueFromObject } = loadRuntime();
    const object = { entries: [{ value: 7 }] };
    assert.equal(getValueFromObject('', object), object);
    assert.equal(getValueFromObject('entries[0].value', object), 7);
    assert.equal(getValueFromObject('entries[1].value', object), undefined);
    assert.equal(getValueFromObject('entries[0].missing', object), undefined);
});

test('object paths create and replace nested object values', () => {
    const { getValueFromObject, setValueToObject } = loadRuntime();
    const object = {};
    setValueToObject('user.profile.name', object, 'Ava');
    assert.equal(getValueFromObject('user.profile.name', object), 'Ava');
    setValueToObject('user.profile.name', object, 'Bea');
    assert.equal(getValueFromObject('user.profile.name', object), 'Bea');
});

test('object paths traverse and write actual Map entries in the runtime realm', () => {
    const context = loadRuntimeContext();
    const { getValueFromObject, setValueToObject } = context.Aventus;
    const map = runInNewContext('new Map()', context);
    setValueToObject('record.value', map, 8);
    assert.equal(map.has('record'), true);
    assert.equal(map.get('record').value, 8);
    assert.equal(getValueFromObject('record.value', map), 8);
});

test('empty object paths return the root on read and are rejected on write', () => {
    const { getValueFromObject, setValueToObject } = loadRuntime();
    const object = { existing: 1 };
    assert.equal(getValueFromObject(undefined, object), object);
    assert.equal(getValueFromObject('', object), object);
    assert.throws(() => setValueToObject('', object, 9), { name: 'TypeError', message: /empty object path/ });
    assert.equal(Object.hasOwn(object, ''), false);
    assert.equal(object.existing, 1);
    assert.equal(getValueFromObject('', object), object);
});

test('object paths stop reading at primitive intermediates and reject writes through them', () => {
    const { getValueFromObject, setValueToObject } = loadRuntime();
    const object = { count: 0, enabled: false, missing: null, label: 'fixed' };
    assert.equal(getValueFromObject('count.value', object), undefined);
    assert.equal(getValueFromObject('enabled.value', object), undefined);
    assert.equal(getValueFromObject('missing.value', object), undefined);
    assert.throws(() => setValueToObject('count.value', object, 1), { name: 'TypeError', message: /count/ });
    assert.throws(() => setValueToObject('enabled.value', object, 2), { name: 'TypeError', message: /enabled/ });
    assert.throws(() => setValueToObject('missing.value', object, 3), { name: 'TypeError', message: /missing/ });
    assert.equal(object.count, 0);
    assert.equal(object.enabled, false);
    assert.equal(object.missing, null);
    assert.equal(object.label, 'fixed');
});

test('writing through a truthy primitive intermediate fails without changing it', () => {
    const { setValueToObject } = loadRuntime();
    const object = { count: 5 };
    assert.throws(() => setValueToObject('count.value', object, 1), { name: 'TypeError', message: /count/ });
    assert.equal(object.count, 5);
});

test('object paths create only absent intermediates', () => {
    const { setValueToObject } = loadRuntime();
    const object = { existing: undefined };
    setValueToObject('new.value', object, 1);
    assert.equal(object.new.value, 1);
    assert.throws(() => setValueToObject('existing.value', object, 2), { name: 'TypeError', message: /existing/ });
    assert.equal(object.existing, undefined);
});
