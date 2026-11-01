import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const result = await build({ entryPoints: ['cli/src/interaction/action/tools.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);

test('exit shortcut requires Ctrl+L and ignores other key combinations', () => {
  assert.equal(module.exports.isExitKey({ name: 'l', ctrl: true }), true);
  assert.equal(module.exports.isExitKey({ name: 'l', ctrl: false }), false);
  assert.equal(module.exports.isExitKey({ name: 'x', ctrl: true }), false);
});
