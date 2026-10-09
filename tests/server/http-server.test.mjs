import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { HttpServer } = await loadServerModule('live-server/HttpServer.ts');

test('HTTP server sends live update messages only to open WebSocket clients', () => {
    const server = Object.create(HttpServer.prototype);
    const received = [];
    server.clients = [
        { readyState: 1, send: value => received.push(JSON.parse(value)) },
        { readyState: 3, send: () => { throw new Error('closed socket received a message'); } },
    ];
    server.updateCSS('.card {}', 'demo-card', ['child']);
    server.updateComponent('class Card {}', 'demo-card', []);
    server.updateGlobalCSS('theme', ':root {}');
    assert.deepEqual(received, [
        { cmd: 'update_css', params: { css: '.card {}', element: 'demo-card', children: ['child'] } },
        { cmd: 'update_component', params: { js: 'class Card {}', element: 'demo-card', children: [] } },
        { cmd: 'update_global_css', params: { name: 'theme', css: ':root {}' } },
    ]);
});

test('HTTP server coalesces repeated reload requests', async () => {
    const server = Object.create(HttpServer.prototype);
    const received = [];
    server.clients = [{ readyState: 1, send: value => received.push(JSON.parse(value)) }];
    server.config = { delay: 5 };
    try {
        server.reload();
        server.reload();
        await new Promise(resolve => setTimeout(resolve, 25));
        assert.deepEqual(received, [{ cmd: 'reload', params: {} }]);
    } finally {
        clearTimeout(server.reloadTimeout);
    }
});
