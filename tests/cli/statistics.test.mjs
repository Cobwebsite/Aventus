import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const result = await build({ entryPoints: ['cli/src/server/notification/Statistics.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
const { Statistics } = module.exports;

test('CLI statistics update build and static durations independently and replace file size', () => {
  Statistics.loadFileTime.action(12);
  Statistics.buildTime.action('web', 30);
  Statistics.buildTime.action('api', 20);
  Statistics.buildTime.action('web', 35);
  Statistics.staticTime.action('assets', 8);
  Statistics.sizeFile.action('dist/app.js', 100, 'build', 'web');
  Statistics.sizeFile.action('dist/app.js', 120, 'build', 'web');
  assert.equal(Statistics.info.loadFileTime, 12);
  assert.deepEqual(Statistics.info.builds, { web: { buildTime: 35 }, api: { buildTime: 20 } });
  assert.deepEqual(Statistics.info.statics, { assets: { buildTime: 8 } });
  assert.deepEqual(Statistics.info.files['dist/app.js'], { path: 'dist/app.js', size: 120, type: 'build', typeName: 'web' });
});
