import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { GenericServer } = await loadServerModule('GenericServer.ts');

function serverWithHandlers() {
    const handlers = {};
    const connection = new Proxy({}, {
        get(_target, name) {
            if (String(name).startsWith('on')) return callback => { handlers[name] = callback; };
        },
    });
    const server = new GenericServer(connection);
    Object.defineProperty(server, 'logLevel', { value: 99 });
    return { server, handlers };
}

test('failed Node.js prerequisite stops initialization before settings or services start', async () => {
    const { server, handlers } = serverWithHandlers();
    const calls = [];
    server.checkNodeJs = async () => { calls.push('node'); return false; };
    server.loadSettings = async () => { calls.push('settings'); };
    server.startServer = async () => { calls.push('services'); };
    await handlers.onInitialized();
    assert.deepEqual(calls, ['node']);
});

test('successful Node.js prerequisite awaits settings before starting services', async () => {
    const { server, handlers } = serverWithHandlers();
    const calls = [];
    let releaseSettings;
    const settingsReady = new Promise(resolve => { releaseSettings = resolve; });
    server.checkNodeJs = async () => { calls.push('node'); return true; };
    server.loadSettings = async () => { calls.push('settings'); await settingsReady; calls.push('settings ready'); };
    server.startServer = async () => { calls.push('services'); };
    const initialization = handlers.onInitialized();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(calls, ['node', 'settings']);
    releaseSettings();
    await initialization;
    assert.deepEqual(calls, ['node', 'settings', 'settings ready', 'services']);
});
