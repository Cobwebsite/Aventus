import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

function makeRam(globals = {}) {
    const { GenericRam, ResultWithError, VoidWithError, GenericError, RamErrorCode } = loadRuntime(globals);
    class Item { constructor() { this.id = 0; this.name = ''; } }
    class MemoryRam extends GenericRam {
        rejectSet = false;
        rejectAfterSet = false;
        rejectDelete = false;
        rejectListItemId = undefined;
        rejectBeforeListItemId = undefined;
        defineIndexKey() { return 'id'; }
        getTypeForData() { return Item; }
        async transformCreateRequestToItem(item) { return this.wrap(item); }
        async transformUpdateRequestToItem(item) { return this.wrap(item); }
        async transformCreateRequestListToItem(items) { return this.wrap(items); }
        async transformUpdateRequestListToItem(items) { return this.wrap(items); }
        wrap(value) { const result = new ResultWithError(); result.result = value; return result; }
        async beforeRecordSet() {
            const result = new VoidWithError();
            if(this.rejectSet) result.errors.push(new GenericError(99, 'set rejected'));
            return result;
        }
        async afterRecordSet() {
            const result = new VoidWithError();
            if(this.rejectAfterSet) result.errors.push(new GenericError(98, 'after set rejected'));
            return result;
        }
        async beforeRecordDelete() {
            const result = new VoidWithError();
            if(this.rejectDelete) result.errors.push(new GenericError(97, 'delete rejected'));
            return result;
        }
        async afterCreateItem(item, fromList) {
            const result = new VoidWithError();
            if(fromList && item.id === this.rejectListItemId) result.errors.push(new GenericError(96, 'list item rejected'));
            return result;
        }
        async beforeCreateItem(item, fromList) {
            const result = new VoidWithError();
            if(fromList && this.rejectBeforeListItemId !== undefined && item.id === this.rejectBeforeListItemId) result.errors.push(new GenericError(95, 'before list item rejected'));
            return result;
        }
        async beforeUpdateItem(item, fromList) {
            const result = new VoidWithError();
            if(fromList && this.rejectBeforeListItemId !== undefined && item.id === this.rejectBeforeListItemId) result.errors.push(new GenericError(95, 'before list item rejected'));
            return result;
        }
        async afterUpdateItem(item, fromList) {
            const result = new VoidWithError();
            if(fromList && item.id === this.rejectListItemId) result.errors.push(new GenericError(96, 'list item rejected'));
            return result;
        }
        async afterDeleteItem(item, fromList) {
            const result = new VoidWithError();
            if(fromList && item.id === this.rejectListItemId) result.errors.push(new GenericError(96, 'list item rejected'));
            return result;
        }
    }
    return { ram: new MemoryRam(), RamErrorCode };
}

test('GenericRam creates, reads, updates and deletes while preserving record identity', async () => {
    const { ram } = makeRam();
    const events = [];
    ram.onCreated(item => events.push(`created:${item.name}`));
    ram.onUpdated(item => events.push(`updated:${item.name}`));
    ram.onDeleted(item => events.push(`deleted:${item.name}`));
    const created = await ram.create({ id: 1, name: 'first' });
    assert.equal(created.name, 'first');
    assert.equal(await ram.getById(1), created);
    assert.equal((await ram.getAll()).length, 1);
    const updated = await ram.update({ id: 1, name: 'second' });
    assert.equal(updated, created);
    assert.equal((await ram.getById(1)).name, 'second');
    assert.equal(await ram.deleteById(1), created);
    assert.equal(await ram.getById(1), undefined);
    assert.deepEqual(events, ['created:first', 'updated:second', 'deleted:second']);
});

test('GenericRam creates and updates lists, reads selected ids and removes lists', async () => {
    const { ram } = makeRam();
    const created = await ram.createList([{ id: 1, name: 'one' }, { id: 2, name: 'two' }]);
    assert.deepEqual(Array.from(created, item => item.name), ['one', 'two']);
    assert.deepEqual(Array.from(await ram.getByIds([2, 1]), item => item.name), ['two', 'one']);
    const updated = await ram.updateList([{ id: 1, name: 'ONE' }, { id: 2, name: 'TWO' }]);
    assert.equal(updated[0], created[0]);
    assert.equal(updated[1], created[1]);
    assert.deepEqual(Array.from(await ram.getAll(), item => item.name), ['ONE', 'TWO']);
    const deleted = await ram.deleteList(created);
    assert.equal(deleted.length, 2);
    assert.deepEqual(Array.from(await ram.getAll()), []);
});

test('GenericRam local subscribers receive updates and deletion until the record is removed', async () => {
    const { ram } = makeRam();
    const item = await ram.create({ id: 7, name: 'initial' });
    const events = [];
    item.onUpdate(value => events.push(`update:${value.name}`));
    item.onDelete(value => events.push(`delete:${value.name}`));
    await ram.update({ id: 7, name: 'changed' });
    await item.delete();
    assert.deepEqual(events, ['update:changed', 'delete:changed']);
    assert.equal(await ram.getById(7), undefined);
});

test('GenericRam does not store a new record after a rejected record-set hook', async () => {
    const { ram } = makeRam();
    const events = [];
    ram.onCreated(item => events.push(item.id));
    ram.rejectSet = true;
    const result = await ram.createWithError({ id: 8, name: 'blocked' });
    assert.equal(result.success, false);
    assert.equal(result.containsCode(99), true);
    assert.equal(await ram.getById(8), undefined);
    assert.deepEqual(events, []);
    ram.rejectSet = false;
    assert.equal((await ram.create({ id: 8, name: 'allowed' })).name, 'allowed');
    assert.equal((await ram.getById(8)).name, 'allowed');
    assert.deepEqual(events, [8]);
});

test('GenericRam reports missing identifiers and missing records without changing storage', async () => {
    const { ram, RamErrorCode } = makeRam();
    const missingId = await ram.createWithError({ name: 'no-id' });
    assert.equal(missingId.success, false);
    assert.equal(missingId.containsCode(RamErrorCode.noId), true);
    const missingUpdate = await ram.updateWithError({ id: 10, name: 'absent' });
    assert.equal(missingUpdate.success, false);
    assert.equal(missingUpdate.containsCode(RamErrorCode.noItemInsideRam), true);
    const missingDelete = await ram.deleteByIdWithError(10);
    assert.equal(missingDelete.success, false);
    assert.equal(missingDelete.containsCode(RamErrorCode.noItemInsideRam), true);
    assert.equal((await ram.getAll()).length, 0);
});

test('GenericRam rejects a duplicate create and keeps the existing record', async () => {
    const { ram, RamErrorCode } = makeRam();
    const events = [];
    ram.onCreated(item => events.push(`created:${item.name}`));
    ram.onUpdated(item => events.push(`updated:${item.name}`));
    const first = await ram.create({ id: 3, name: 'old' });
    const second = await ram.createWithError({ id: 3, name: 'new' });
    assert.equal(second.success, false);
    assert.equal(second.containsCode(RamErrorCode.alreadyExists), true);
    assert.equal(await ram.getById(3), first);
    assert.equal(first.name, 'old');
    assert.equal((await ram.getAll()).length, 1);
    assert.deepEqual(events, ['created:old']);
    assert.equal(await ram.update({ id: 3, name: 'new' }), first);
    assert.deepEqual(events, ['created:old', 'updated:new']);
});

test('GenericRam reports an after-set error and publishes the stored creation', async () => {
    const { ram } = makeRam();
    const events = [];
    ram.onCreated(item => events.push(item.id));
    ram.rejectAfterSet = true;
    const result = await ram.createWithError({ id: 11, name: 'stored' });
    assert.equal(result.success, false);
    assert.equal(result.containsCode(98), true);
    assert.equal(result.result, await ram.getById(11));
    assert.equal(result.result.name, 'stored');
    assert.deepEqual(events, [11]);
});

test('GenericRam preserves a record when the before-delete hook fails and permits retry', async () => {
    const { ram } = makeRam();
    const item = await ram.create({ id: 12, name: 'stored' });
    const events = [];
    ram.onDeleted(item => events.push(item.id));
    ram.rejectDelete = true;
    const result = await ram.deleteByIdWithError(12);
    assert.equal(result.success, false);
    assert.equal(result.containsCode(97), true);
    assert.equal(await ram.getById(12), item);
    assert.deepEqual(events, []);
    ram.rejectDelete = false;
    const repeated = await ram.deleteByIdWithError(12);
    assert.equal(repeated.success, true);
    assert.equal(repeated.result, item);
    assert.equal(await ram.getById(12), undefined);
    assert.deepEqual(events, [12]);
});

test('GenericRam continues list creation after an invalid item and reports applied records', async () => {
    const { ram, RamErrorCode } = makeRam();
    const events = [];
    ram.onCreated(item => events.push(item.id));
    const result = await ram.createListWithError([
        { id: 21, name: 'first' },
        { name: 'invalid' },
        { id: 23, name: 'last' }
    ]);
    assert.equal(result.success, false);
    assert.equal(result.containsCode(RamErrorCode.noId), true);
    assert.deepEqual(Array.from(result.result, item => item.id), [21, 23]);
    assert.equal(result.result[0], await ram.getById(21));
    assert.equal(result.result[1], await ram.getById(23));
    assert.deepEqual(events, [21, 23]);
    assert.deepEqual(Array.from(await ram.getAll(), item => item.id), [21, 23]);
});

test('GenericRam continues list deletion after a missing item and reports applied records', async () => {
    const { ram, RamErrorCode } = makeRam();
    const [first, last] = await ram.createList([{ id: 31, name: 'first' }, { id: 33, name: 'last' }]);
    const events = [];
    ram.onDeleted(item => events.push(item.id));
    const result = await ram.deleteListWithError([{ id: 31 }, { id: 32 }, { id: 33 }]);
    assert.equal(result.success, false);
    assert.equal(result.containsCode(RamErrorCode.noItemInsideRam), true);
    assert.deepEqual(Array.from(result.result, item => item.id), [31, 33]);
    assert.equal(result.result[0], first);
    assert.equal(result.result[1], last);
    assert.deepEqual(events, [31, 33]);
    assert.deepEqual(Array.from(await ram.getAll()), []);
});

test('GenericRam keeps applied list records and continues after item hook errors', async () => {
    const { ram } = makeRam();
    const created = await ram.createList([{ id: 61, name: 'one' }, { id: 62, name: 'two' }, { id: 63, name: 'three' }]);
    const events = [];
    ram.onCreated(item => events.push(`created:${item.id}`));
    ram.onUpdated(item => events.push(`updated:${item.id}`));
    ram.onDeleted(item => events.push(`deleted:${item.id}`));
    created[0].onDelete(() => events.push('local delete'));
    ram.rejectListItemId = 62;

    const update = await ram.updateListWithError([{ id: 61, name: 'ONE' }, { id: 62, name: 'TWO' }, { id: 63, name: 'THREE' }]);
    assert.equal(update.success, false);
    assert.equal(update.containsCode(96), true);
    assert.deepEqual(Array.from(update.result, item => item.id), [61, 62, 63]);
    assert.equal(await ram.getById(61), created[0]);
    assert.equal(await ram.getById(62), created[1]);
    assert.deepEqual(Array.from(created, item => item.name), ['ONE', 'TWO', 'THREE']);
    assert.deepEqual(events, ['updated:61', 'updated:62', 'updated:63']);

    const deletion = await ram.deleteListWithError([{ id: 61 }, { id: 62 }, { id: 63 }]);
    assert.equal(deletion.success, false);
    assert.equal(deletion.containsCode(96), true);
    assert.deepEqual(Array.from(deletion.result, item => item.id), [61, 62, 63]);
    assert.deepEqual(Array.from(await ram.getAll()), []);
    assert.deepEqual(events, ['updated:61', 'updated:62', 'updated:63', 'deleted:61', 'local delete', 'deleted:62', 'deleted:63']);

    const hookCreation = await ram.createListWithError([{ id: 64, name: 'four' }, { id: 62, name: 'two again' }, { id: 65, name: 'five' }]);
    assert.equal(hookCreation.success, false);
    assert.equal(hookCreation.containsCode(96), true);
    assert.deepEqual(Array.from(hookCreation.result, item => item.id), [64, 62, 65]);
    assert.deepEqual(events.slice(-3), ['created:64', 'created:62', 'created:65']);
});

test('GenericRam reports records written before an after-set error and keeps processing the list', async () => {
    const { ram } = makeRam();
    const events = [];
    ram.onCreated(item => events.push(item.id));
    ram.rejectAfterSet = true;
    const result = await ram.createListWithError([{ id: 66, name: 'first' }, { id: 67, name: 'second' }]);
    assert.equal(result.success, false);
    assert.equal(result.errors.filter(error => error.code === 98).length, 2);
    assert.deepEqual(Array.from(result.result, item => item.id), [66, 67]);
    assert.equal(result.result[0], await ram.getById(66));
    assert.equal(result.result[1], await ram.getById(67));
    assert.deepEqual(events, [66, 67]);
});

test('GenericRam stops before list transformation when a before-item hook fails', async () => {
    const { ram } = makeRam();
    let createTransforms = 0;
    let updateTransforms = 0;
    const createTransform = ram.transformCreateRequestListToItem.bind(ram);
    const updateTransform = ram.transformUpdateRequestListToItem.bind(ram);
    ram.transformCreateRequestListToItem = async list => {
        createTransforms++;
        return createTransform(list);
    };
    ram.transformUpdateRequestListToItem = async list => {
        updateTransforms++;
        return updateTransform(list);
    };
    ram.rejectBeforeListItemId = 92;
    const creation = await ram.createListWithError([{ id: 91, name: 'one' }, { id: 92, name: 'two' }]);
    assert.equal(creation.success, false);
    assert.equal(creation.containsCode(95), true);
    assert.deepEqual(Array.from(creation.result), []);
    assert.equal(createTransforms, 0);
    assert.deepEqual(Array.from(await ram.getAll()), []);

    ram.rejectBeforeListItemId = undefined;
    const existing = await ram.createList([{ id: 91, name: 'one' }, { id: 92, name: 'two' }]);
    ram.rejectBeforeListItemId = 92;
    const update = await ram.updateListWithError([{ id: 91, name: 'ONE' }, { id: 92, name: 'TWO' }]);
    assert.equal(update.success, false);
    assert.equal(update.containsCode(95), true);
    assert.deepEqual(Array.from(update.result), []);
    assert.equal(updateTransforms, 0);
    assert.equal(existing[0].name, 'one');
    assert.equal(existing[1].name, 'two');
});

test('GenericRam reports subscriber errors while completing committed notifications', async () => {
    const reported = [];
    const { ram } = makeRam({ console: { error: error => reported.push(error) } });
    const events = [];
    ram.onCreated(() => { throw new Error('global subscriber failed'); });
    ram.onCreated(item => events.push(`created:${item.id}`));
    const created = await ram.createListWithError([{ id: 81, name: 'one' }, { id: 82, name: 'two' }]);
    assert.equal(created.success, true);
    assert.deepEqual(events, ['created:81', 'created:82']);
    assert.equal(reported.length, 2);
    assert.equal(await ram.getById(81), created.result[0]);
    created.result[0].onDelete(() => { throw new Error('local subscriber failed'); });
    created.result[0].onDelete(() => events.push('local delete'));
    const deleted = await ram.deleteListWithError([{ id: 81 }, { id: 82 }]);
    assert.equal(deleted.success, true);
    assert.deepEqual(events, ['created:81', 'created:82', 'local delete']);
    assert.equal(reported.length, 3);
    assert.equal(reported[2].message, 'local subscriber failed');
});

test('GenericRam coalesces concurrent creates of the same request object', async () => {
    const { ram } = makeRam();
    const events = [];
    ram.onCreated(item => events.push(item.id));
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const original = ram.transformCreateRequestToItem.bind(ram);
    let transformations = 0;
    ram.transformCreateRequestToItem = async item => {
        transformations++;
        await gate;
        return original(item);
    };
    const request = { id: 41, name: 'shared' };
    const first = ram.createWithError(request);
    const second = ram.createWithError(request);
    release();
    const [a, b] = await Promise.all([first, second]);
    assert.equal(a, b);
    assert.equal(a.success, true);
    assert.equal(transformations, 1);
    assert.equal(await ram.getById(41), a.result);
    assert.deepEqual(events, [41]);
});

test('GenericRam continues list updates after an invalid item while preserving record identity', async () => {
    const { ram, RamErrorCode } = makeRam();
    const [first, last] = await ram.createList([{ id: 51, name: 'old first' }, { id: 53, name: 'old last' }]);
    const events = [];
    ram.onCreated(item => events.push(`created:${item.id}`));
    ram.onUpdated(item => events.push(`updated:${item.id}`));
    const result = await ram.updateListWithError([
        { id: 51, name: 'new first' },
        { name: 'invalid' },
        { id: 53, name: 'new last' }
    ]);
    assert.equal(result.success, false);
    assert.equal(result.containsCode(RamErrorCode.noId), true);
    assert.deepEqual(Array.from(result.result, item => item.id), [51, 53]);
    assert.equal(result.result[0], first);
    assert.equal(result.result[1], last);
    assert.equal(await ram.getById(51), first);
    assert.equal(first.name, 'new first');
    assert.equal(await ram.getById(53), last);
    assert.equal(last.name, 'new last');
    assert.deepEqual(events, ['updated:51', 'updated:53']);
});

test('GenericRam rejects the second distinct concurrent create for one id', async () => {
    const { ram, RamErrorCode } = makeRam();
    const events = [];
    ram.onCreated(item => events.push(item.name));
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const original = ram.transformCreateRequestToItem.bind(ram);
    let transformations = 0;
    ram.transformCreateRequestToItem = async item => {
        transformations++;
        await gate;
        return original(item);
    };
    const first = ram.createWithError({ id: 61, name: 'first' });
    const second = ram.createWithError({ id: 61, name: 'second' });
    release();
    const [a, b] = await Promise.all([first, second]);
    assert.equal(a.success, true);
    assert.equal(b.success, false);
    assert.equal(b.containsCode(RamErrorCode.alreadyExists), true);
    assert.notEqual(a, b);
    assert.equal(transformations, 2);
    assert.equal(a.result, await ram.getById(61));
    assert.equal((await ram.getById(61)).name, 'first');
    assert.deepEqual(events, ['first']);
});
