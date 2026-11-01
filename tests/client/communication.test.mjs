import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const result = await build({ entryPoints: ['client/src/customEditors/_Communication.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
const { Communication, Uri } = module.exports;

function webview() {
  const sent = [];
  let receive;
  let disposed = false;
  return {
    sent,
    view: {
      onDidReceiveMessage(callback) { receive = callback; return { dispose() { disposed = true; } }; },
      postMessage(message) { sent.push(message); },
    },
    async dispatch(message) { await receive(message); },
    get disposed() { return disposed; },
  };
}

test('webview message subscription is released on dispose', () => {
  const target = webview();
  const comm = new Communication(target.view);
  comm.dispose();
  assert.equal(target.disposed, true);
});

test('webview route extracts typed URI parameters and sends callback response', async () => {
  const target = webview();
  const comm = new Communication(target.view);
  const seen = [];
  comm.addRouteWithResponse({ channel: 'item/{id:number}', callback(data, params) { seen.push([data, params]); return { ok: true }; } });
  await target.dispatch({ channel: 'item/42', uid: 'request', data: { name: 'A' } });
  assert.deepEqual(seen, [[{ name: 'A' }, { id: 42 }]]);
  assert.deepEqual(target.sent, [{ channel: 'item/42', uid: 'request', data: { ok: true } }]);
  await target.dispatch({ channel: 'item/not-a-number', uid: 'other' });
  assert.equal(target.sent.length, 1);
  assert.deepEqual(Uri.getParams('file/{name}', 'FILE/Test'), { name: 'test' });
});

test('webview route can be removed without receiving later messages', async () => {
  const target = webview();
  const comm = new Communication(target.view);
  let calls = 0;
  const route = { channel: 'refresh', callback() { calls++; } };
  comm.addRoute(route);
  await target.dispatch({ channel: 'refresh' });
  comm.removeRoute(route);
  await target.dispatch({ channel: 'refresh' });
  assert.equal(calls, 1);
});

test('sendWithResponse resolves only for a matching channel and UID', async () => {
  const target = webview();
  const comm = new Communication(target.view);
  const originalError = console.error;
  const errors = [];
  console.error = message => errors.push(message);
  try {
    const pending = comm.sendWithResponse({ channel: 'status', uid: 'same', timeout: 50 });
    assert.deepEqual(target.sent, [{ channel: 'status', uid: 'same' }]);
    await target.dispatch({ channel: 'other', uid: 'same', data: 'wrong channel' });
    await target.dispatch({ channel: 'status', uid: 'other', data: 'wrong uid' });
    assert.equal(typeof comm.waitingList.same, 'function');
    await target.dispatch({ channel: 'status', uid: 'same', data: 'ready' });
    assert.equal(await pending, 'ready');
    assert.deepEqual(errors, []);
    assert.deepEqual(comm.waitingList, {});
  } finally { console.error = originalError; }
});
