import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadRuntime } from './helpers/load-runtime.mjs';

test('HttpRouter sends GET and POST to its base URL with JSON headers and body', async () => {
    const calls = [];
    const { HttpRouter } = loadRuntime({ fetch: async (url, options) => {
        calls.push({ url, method: options.method, body: options.body, headers: options.headers });
        return new Response(JSON.stringify({ accepted: true }), { status: 200 });
    } });
    HttpRouter.configure({ url: 'https://example.test' });
    const router = new HttpRouter();
    assert.equal((await router.get('items')).result.accepted, true);
    assert.equal((await router.post('/items', { count: 2 })).result.accepted, true);
    assert.deepEqual(calls.map(call => [call.url, call.method, call.body]), [
        ['https://example.test/items', 'GET', undefined],
        ['https://example.test/items', 'POST', '{"count":2}'],
    ]);
    assert.equal(calls[1].headers.some(([name]) => name === 'Content-Type'), true);
    assert.equal(calls[1].headers.some(([name]) => name === 'Accept'), true);
});

test('HttpRequest turns transport and JSON decoding failures into result errors', async () => {
    let failTransport = true;
    const { HttpRequest, HttpErrorCode } = loadRuntime({ fetch: async () => {
        if(failTransport) throw new Error('network');
        return new Response('not-json', { status: 200 });
    } });
    const request = new HttpRequest('/item');
    const first = await request.queryJSON();
    assert.equal(first.success, false);
    assert.equal(first.containsCode(HttpErrorCode.unknow), true);
    failTransport = false;
    const second = await request.queryJSON();
    assert.equal(second.success, false);
    assert.equal(second.containsCode(HttpErrorCode.unknow), true);
});

test('HttpRequest reads a binary response and accepts an empty 204 response', async () => {
    const urls = [];
    const { HttpRequest } = loadRuntime({ fetch: async url => {
        urls.push(url);
        if(url === '/file') return new Response(new Blob(['binary data'], { type: 'text/plain' }));
        return new Response(null, { status: 204 });
    } });
    const blobResult = await new HttpRequest('/file').queryBlob();
    assert.equal(blobResult.success, true);
    assert.equal(blobResult.result instanceof Blob, true);
    assert.equal(await blobResult.result.text(), 'binary data');
    const voidResult = await new HttpRequest('/delete').queryVoid();
    assert.equal(voidResult.success, true);
    assert.deepEqual(urls, ['/file', '/delete']);
});

test('HttpRequest currently returns parsed JSON from a non-2xx response as success', async () => {
    const { HttpRequest } = loadRuntime({ fetch: async () =>
        new Response('{"message":"missing"}', { status: 404 }) });
    const result = await new HttpRequest('/missing').queryJSON();
    assert.equal(result.success, true);
    assert.equal(result.result.message, 'missing');
});

test('HttpRequest applies beforeSend and response middleware around the transport', async () => {
    const events = [];
    const { HttpRequest, VoidWithError } = loadRuntime({ fetch: async (_url, options) => {
        events.push(`fetch:${options.headers.some(([name]) => name === 'X-Test')}`);
        return new Response('ok');
    } });
    HttpRequest.configure({
        beforeSend(request) {
            events.push('before');
            request.setHeader('X-Test', 'yes');
            return new VoidWithError();
        },
        responseMiddleware(response) {
            events.push(`after:${response.success}`);
            return response;
        },
    });
    const result = await new HttpRequest('/middleware').queryTxt();
    assert.equal(result.success, true);
    assert.equal(result.result, 'ok');
    assert.deepEqual(events, ['before', 'fetch:true', 'after:true']);
});

test('HttpRequest currently sends the request even when beforeSend returns errors', async () => {
    let transports = 0;
    const { HttpRequest, VoidWithError, GenericError } = loadRuntime({ fetch: async () => {
        transports++;
        return new Response('{}');
    } });
    HttpRequest.configure({ beforeSend() {
        const result = new VoidWithError();
        result.errors.push(new GenericError(9, 'stop'));
        return result;
    } });
    const result = await new HttpRequest('/should-stop').queryJSON();
    assert.equal(result.success, false);
    assert.equal(result.containsCode(9), true);
    assert.equal(transports, 1);
});

test('HttpRouter sends PUT, DELETE and OPTION with their own methods', async () => {
    const methods = [];
    const { HttpRouter } = loadRuntime({ fetch: async (_url, options) => {
        methods.push(options.method);
        return new Response('{}');
    } });
    HttpRouter.configure({ url: 'https://example.test' });
    const router = new HttpRouter();
    await router.put('/item', { value: 1 });
    await router.delete('/item');
    await router.option('/item');
    assert.deepEqual(methods, ['PUT', 'DELETE', 'OPTION']);
});

test('HttpRequest response middleware can replace a transport failure', async () => {
    const { HttpRequest, ResultWithError, HttpResponse } = loadRuntime({
        fetch: async () => { throw new Error('offline'); },
    });
    HttpRequest.configure({ responseMiddleware(result) {
        assert.equal(result.success, false);
        const replacement = new ResultWithError();
        replacement.result = new HttpResponse(new Response('fallback'));
        return replacement;
    } });
    const result = await new HttpRequest('/fallback').queryTxt();
    assert.equal(result.success, true);
    assert.equal(result.result, 'fallback');
});

test('HttpRequest sends FormData and spoofs PUT as POST when enabled', async () => {
    const calls = [];
    const { HttpRequest, HttpMethod } = loadRuntime({ fetch: async (_url, options) => {
        calls.push(options);
        return new Response('{}');
    } });
    const form = new FormData();
    form.append('title', 'draft');
    const request = new HttpRequest('/upload', HttpMethod.PUT, form, true);
    assert.equal((await request.queryJSON()).success, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[0].body.get('title'), 'draft');
    assert.equal(calls[0].body.get('_method'), 'PUT');
});

test('HttpRequest converts nested objects containing a file into FormData', async () => {
    class FakeFile extends Blob {}
    let sent;
    const { HttpRequest, HttpMethod } = loadRuntime({ File: FakeFile, fetch: async (_url, options) => {
        sent = options;
        return new Response('{}');
    } });
    const file = new FakeFile(['bytes'], { type: 'text/plain' });
    const request = new HttpRequest('/upload', HttpMethod.POST, {
        user: { name: 'Ava', attachment: file }, note: null,
    });
    assert.equal((await request.queryJSON()).success, true);
    assert.equal(sent.body instanceof FormData, true);
    assert.equal(sent.body.get('user[name]'), 'Ava');
    assert.equal(sent.body.get('user[attachment]') instanceof Blob, true);
    assert.equal(sent.body.get('note'), '');
    assert.equal(sent.headers.some(([name]) => name === 'Content-Type'), false);
});

test('HttpRequest spoofs DELETE with FormData and preserves its original fields', async () => {
    let sent;
    const { HttpRequest, HttpMethod } = loadRuntime({ fetch: async (_url, options) => {
        sent = options;
        return new Response('{}');
    } });
    const form = new FormData();
    form.append('id', '4');
    assert.equal((await new HttpRequest('/item', HttpMethod.DELETE, form, true).queryJSON()).success, true);
    assert.equal(sent.method, 'POST');
    assert.equal(sent.body.get('id'), '4');
    assert.equal(sent.body.get('_method'), 'DELETE');
});

test('HttpRequest expands an array of files into indexed FormData fields', async () => {
    class FakeFile extends Blob {}
    let sent;
    const { HttpRequest, HttpMethod } = loadRuntime({ File: FakeFile, fetch: async (_url, options) => {
        sent = options;
        return new Response('{}');
    } });
    const first = new FakeFile(['a'], { type: 'text/plain' });
    const second = new FakeFile(['b'], { type: 'text/plain' });
    const result = await new HttpRequest('/files', HttpMethod.POST, { files: [first, second] }).queryJSON();
    assert.equal(result.success, true);
    assert.equal(sent.body instanceof FormData, true);
    assert.equal(sent.body.get('files[0]') instanceof Blob, true);
    assert.equal(sent.body.get('files[1]') instanceof Blob, true);
    assert.equal(sent.body.getAll('files[0]').length, 1);
});

test('HttpRequest cache can be enabled and disabled for the same request', async () => {
    let transports = 0;
    const { HttpRequest } = loadRuntime({ fetch: async () => {
        transports++;
        return new Response(JSON.stringify({ count: transports }));
    } });
    const request = new HttpRequest('/cached');
    request.enableCache();
    assert.equal((await request.queryJSON()).result.count, 1);
    assert.equal((await request.queryJSON()).result.count, 1);
    assert.equal(transports, 1);
    request.disableCache();
    assert.equal((await request.queryJSON()).result.count, 2);
    assert.equal(transports, 2);
});

test('HttpRoute uses a supplied router URL prefix', async () => {
    const urls = [];
    const { HttpRoute, HttpRouter } = loadRuntime({ fetch: async url => {
        urls.push(url);
        return new Response('{}');
    } });
    HttpRouter.configure({ url: 'https://default.test' });
    const router = new HttpRouter();
    router.options.url = 'https://example.test/api';
    class Route extends HttpRoute {
        getItem() { return this.router.get('/items/4'); }
    }
    const route = new Route(router);
    assert.equal((await route.getItem()).success, true);
    assert.deepEqual(urls, ['https://example.test/api/items/4']);
});
