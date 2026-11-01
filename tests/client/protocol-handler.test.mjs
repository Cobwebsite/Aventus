import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const downloads = [];
let registered;
let disposed = false;
globalThis.__aventusProtocolTest = { downloads };
const result = await build({ entryPoints: ['client/src/ProtocolHandler.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'download-double', setup(build) {
    build.onResolve({ filter: /\.\/cmds\/store\/DownloadTemplate$/ }, () => ({ path: 'download', namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const StoreDownloadTemplate = { execute: url => globalThis.__aventusProtocolTest.downloads.push(url) };', loader: 'js' }));
  } }],
});
const vscode = { window: { registerUriHandler(handler) { registered = handler; return { dispose() { disposed = true; } }; } } };
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { ProtocolHandler } = module.exports;

test('protocol handler accepts only template downloads with a URL and disposes registration', () => {
  const handler = new ProtocolHandler();
  assert.equal(registered, handler);
  handler.handleUri({ path: '/other', query: 'url=https%3A%2F%2Fexample.test%2Fa' });
  handler.handleUri({ path: '/template/download', query: 'other=x' });
  assert.deepEqual(downloads, []);
  handler.handleUri({ path: '/template/download', query: 'url=https%3A%2F%2Fexample.test%2Fa%3Fb%3D1' });
  assert.deepEqual(downloads, ['https://example.test/a?b=1']);
  handler.dispose();
  assert.equal(disposed, true);
});
