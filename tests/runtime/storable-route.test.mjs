import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('StorableRoute sends CRUD requests to its named collection and item URLs', async () => {
    const calls = [];
    const { HttpRouter, StorableRoute } = loadRuntime({ fetch: async (url, options) => {
        calls.push({ url, method: options.method, body: options.body });
        return new Response(JSON.stringify({ ok: true }));
    } });
    HttpRouter.configure({ url: 'https://example.test' });
    class Items extends StorableRoute { StorableName() { return 'items'; } }
    const route = new Items(new HttpRouter());
    assert.equal((await route.GetAll()).success, true);
    assert.equal((await route.Create({ item: { id: 3 } })).success, true);
    assert.equal((await route.GetById(3)).success, true);
    assert.equal((await route.Update(3, { body: { id: 3, name: 'new' } })).success, true);
    assert.equal((await route.Delete(3)).success, true);
    assert.deepEqual(calls.map(({ url, method }) => [url, method]), [
        ['https://example.test/items', 'GET'],
        ['https://example.test/items', 'POST'],
        ['https://example.test/items/3', 'GET'],
        ['https://example.test/items/3', 'PUT'],
        ['https://example.test/items/3', 'DELETE'],
    ]);
    assert.equal(calls[1].body, '{"item":{"id":3}}');
    assert.equal(calls[3].body, '{"body":{"id":3,"name":"new"}}');
});

test('StorableRoute propagates transport failures through result errors', async () => {
    const { HttpRouter, StorableRoute, HttpErrorCode } = loadRuntime({
        fetch: async () => { throw new Error('offline'); },
    });
    HttpRouter.configure({ url: 'https://example.test' });
    class Items extends StorableRoute { StorableName() { return 'items'; } }
    const result = await new Items(new HttpRouter()).GetById(5);
    assert.equal(result.success, false);
    assert.equal(result.containsCode(HttpErrorCode.unknow), true);
});

test('StorableRoute currently returns serialized application errors as successful data', async () => {
    const { HttpRouter, StorableRoute } = loadRuntime({ fetch: async () =>
        new Response(JSON.stringify({ errors: [{ code: 12, message: 'invalid' }] }), { status: 422 }) });
    HttpRouter.configure({ url: 'https://example.test' });
    class Items extends StorableRoute { StorableName() { return 'items'; } }
    const result = await new Items(new HttpRouter()).Create({ item: { id: 1 } });
    assert.equal(result.success, true);
    assert.equal(result.errors.length, 0);
    assert.equal(result.result.errors[0].code, 12);
});

test('StorableRoute Delete treats an empty 204 response as a decoding error', async () => {
    const { HttpRouter, StorableRoute, HttpErrorCode } = loadRuntime({ fetch: async () =>
        new Response(null, { status: 204 }) });
    HttpRouter.configure({ url: 'https://example.test' });
    class Items extends StorableRoute { StorableName() { return 'items'; } }
    const result = await new Items(new HttpRouter()).Delete(1);
    assert.equal(result.success, false);
    assert.equal(result.containsCode(HttpErrorCode.unknow), true);
});

test('GenericRam adapter backed by StorableRoute synchronizes remote CRUD with local records', async () => {
    const remote = new Map();
    const calls = [];
    const { HttpRouter, StorableRoute, GenericRam, ResultWithError, VoidWithError } = loadRuntime({
        fetch: async (url, options) => {
            const method = options.method;
            const id = Number(url.split('/').at(-1));
            calls.push(method);
            if(method === 'POST') {
                const item = JSON.parse(options.body).item;
                remote.set(item.id, { ...item });
                return new Response(JSON.stringify(item));
            }
            if(method === 'PUT') {
                const item = JSON.parse(options.body).body;
                remote.set(id, { ...item });
                return new Response(JSON.stringify(item));
            }
            if(method === 'DELETE') {
                const item = remote.get(id);
                remote.delete(id);
                return new Response(JSON.stringify(item));
            }
            return new Response(JSON.stringify(remote.get(id)));
        }
    });
    HttpRouter.configure({ url: 'https://example.test' });
    class Items extends StorableRoute { StorableName() { return 'items'; } }
    const route = new Items(new HttpRouter());
    class Item { constructor() { this.id = 0; this.name = ''; } }
    class ItemsRam extends GenericRam {
        defineIndexKey() { return 'id'; }
        getTypeForData() { return Item; }
        async transformCreateRequestToItem(item) { return route.Create({ item }); }
        async transformUpdateRequestToItem(item) { return route.Update(item.id, { body: item }); }
        async transformCreateRequestListToItem() { return new ResultWithError(); }
        async transformUpdateRequestListToItem() { return new ResultWithError(); }
        async beforeRecordDelete(item) {
            const response = await route.Delete(item.id);
            const result = new VoidWithError();
            result.errors = response.errors;
            return result;
        }
    }
    const ram = new ItemsRam();
    const events = [];
    ram.onCreated(item => events.push(`created:${item.name}`));
    ram.onUpdated(item => events.push(`updated:${item.name}`));
    ram.onDeleted(item => events.push(`deleted:${item.name}`));
    const created = await ram.create({ id: 1, name: 'first' });
    assert.equal(created.name, remote.get(1).name);
    const updated = await ram.update({ id: 1, name: 'second' });
    assert.equal(updated, created);
    assert.equal(updated.name, remote.get(1).name);
    assert.equal(await ram.deleteById(1), created);
    assert.equal(await ram.getById(1), undefined);
    assert.equal(remote.has(1), false);
    assert.deepEqual(calls, ['POST', 'PUT', 'DELETE']);
    assert.deepEqual(events, ['created:first', 'updated:second', 'deleted:second']);
});
