import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('HttpCache reuses matching requests and refetches after targeted invalidation', async () => {
    const calls = [];
    const { HttpCache } = loadRuntime({ fetch: async (url, options) => {
        calls.push([url, options.method]);
        return new Response(`reply-${calls.length}`, { status: 200 });
    } });
    const get = { method: 'GET' };
    const first = await HttpCache.fetch('/items', get);
    assert.equal(await first.text(), 'reply-1');
    assert.equal(await (await HttpCache.fetch('/items', get)).text(), 'reply-1');
    assert.equal(await (await HttpCache.fetch('/items', { method: 'POST', body: 'a' })).text(), 'reply-2');
    assert.equal(await (await HttpCache.fetch('/items', { method: 'POST', body: 'b' })).text(), 'reply-3');
    HttpCache.clear('/items', get);
    assert.equal(await (await HttpCache.fetch('/items', get)).text(), 'reply-4');
    assert.deepEqual(calls, [['/items', 'GET'], ['/items', 'POST'], ['/items', 'POST'], ['/items', 'GET']]);
});

test('HttpResponse forwards metadata and parses JSON once', async () => {
    const { HttpResponse } = loadRuntime();
    let reads = 0;
    const raw = {
        status: 201, statusText: 'Created', ok: true, redirected: false,
        type: 'basic', url: '/created', headers: new Headers({ 'x-test': 'yes' }),
        async json() { reads++; return { value: [1, 2] }; },
    };
    const response = new HttpResponse(raw);
    assert.equal(response.status, 201);
    assert.equal(response.statusText, 'Created');
    assert.equal(response.ok, true);
    assert.equal(response.headers.get('x-test'), 'yes');
    assert.deepEqual(Array.from((await response.json()).value), [1, 2]);
    assert.deepEqual(Array.from((await response.json()).value), [1, 2]);
    assert.equal(reads, 1);
});

test('HttpCache shares an in-flight request with matching callers', async () => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let fetches = 0;
    const { HttpCache } = loadRuntime({ fetch: async () => {
        fetches++;
        await gate;
        return new Response(`response-${fetches}`);
    } });
    const request = { method: 'GET' };
    const first = HttpCache.fetch('/concurrent', request);
    const second = HttpCache.fetch('/concurrent', request);
    assert.equal(fetches, 1);
    release();
    const [firstResponse, secondResponse] = await Promise.all([first, second]);
    assert.equal(firstResponse, secondResponse);
    assert.equal(fetches, 1);
});

test('HttpCache retries after a shared transport failure', async () => {
    const error = new Error('offline');
    let reject;
    const gate = new Promise((resolve, rejectPromise) => { reject = rejectPromise; });
    let fetches = 0;
    const { HttpCache } = loadRuntime({ fetch: () => {
        fetches++;
        return fetches === 1 ? gate : Promise.resolve(new Response('recovered'));
    } });
    const request = { method: 'GET' };
    const first = HttpCache.fetch('/retry', request);
    const second = HttpCache.fetch('/retry', request);
    assert.equal(fetches, 1);
    reject(error);
    const failures = await Promise.allSettled([first, second]);
    assert.deepEqual(failures.map(result => result.status), ['rejected', 'rejected']);
    assert.equal(failures[0].reason, error);
    assert.equal(failures[1].reason, error);
    assert.equal(await (await HttpCache.fetch('/retry', request)).text(), 'recovered');
    assert.equal(fetches, 2);
});

test('HttpResponse reads text and blob bodies at most once per response', async () => {
    const { HttpResponse } = loadRuntime();
    let textReads = 0;
    const textResponse = new HttpResponse({ async text() { textReads++; return 'plain'; } });
    assert.equal(await textResponse.text(), 'plain');
    assert.equal(await textResponse.text(), 'plain');
    assert.equal(textReads, 1);
    let blobReads = 0;
    const blob = new Blob(['image']);
    const blobResponse = new HttpResponse({ async blob() { blobReads++; return blob; } });
    assert.equal(await blobResponse.blob(), blob);
    assert.equal(await blobResponse.blob(), blob);
    assert.equal(blobReads, 1);
});

test('HttpResponse currently does not retry after a failed body read', async () => {
    const { HttpResponse } = loadRuntime();
    let reads = 0;
    const response = new HttpResponse({ async text() { reads++; throw new Error('broken'); } });
    await assert.rejects(response.text(), /broken/);
    assert.equal(await response.text(), undefined);
    assert.equal(reads, 1);
});

test('HttpResponse currently returns undefined to a concurrent second body reader', async () => {
    const { HttpResponse } = loadRuntime();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let reads = 0;
    const response = new HttpResponse({ async text() { reads++; await gate; return 'body'; } });
    const first = response.text();
    const second = response.text();
    assert.equal(await second, undefined);
    release();
    assert.equal(await first, 'body');
    assert.equal(reads, 1);
});

test('HttpResponse currently returns the first body format to a later different reader', async () => {
    const { HttpResponse } = loadRuntime();
    const response = new HttpResponse({ async text() { return 'plain'; }, async json() { return { value: 1 }; } });
    assert.equal(await response.text(), 'plain');
    assert.equal(await response.json(), 'plain');
});
