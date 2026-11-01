import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const source = [
  'RegisterBuild', 'UnregisterBuild', 'RegisterData', 'UnregisterData',
  'RegisterStatic', 'UnregisterStatic',
].map(name => `export { ${name} } from './client/src/notification/${name}.ts';`).join('\n');
const result = await build({
  stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'registries-entry.ts' },
  bundle: true, platform: 'node', format: 'cjs', write: false,
  plugins: [{ name: 'isolated-singleton', setup(build) {
    build.onResolve({ filter: /\.\.\/Singleton$/ }, () => ({ path: 'singleton', namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const Singleton = globalThis.__aventusTestSingleton;', loader: 'js' }));
  } }],
});
const state = { allBuilds: {}, allStatics: {}, dataClasses: {} };
globalThis.__aventusTestSingleton = state;
const module = { exports: {} };
try {
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, require);
} finally {
  delete globalThis.__aventusTestSingleton;
}
const actions = module.exports;

test('build registry ignores duplicates, isolates projects and supports removal and recreation', () => {
  const add = actions.RegisterBuild.action;
  const remove = actions.UnregisterBuild.action;
  add({ pathConfig: 'one', buildName: 'web' });
  add({ pathConfig: 'one', buildName: 'web' });
  add({ pathConfig: 'two', buildName: 'web' });
  assert.deepEqual(state.allBuilds, { one: ['web'], two: ['web'] });
  remove({ pathConfig: 'one', buildName: 'missing' });
  remove({ pathConfig: 'missing', buildName: 'web' });
  assert.deepEqual(state.allBuilds.one, ['web']);
  remove({ pathConfig: 'one', buildName: 'web' });
  assert.deepEqual(state.allBuilds.one, []);
  add({ pathConfig: 'one', buildName: 'web' });
  assert.deepEqual(state.allBuilds.one, ['web']);
  assert.deepEqual(state.allBuilds.two, ['web']);
});

test('data and static registries replace their values and remove only their own URI', () => {
  actions.RegisterData.action([['first'], 'one']);
  actions.RegisterData.action([['second'], 'one']);
  actions.RegisterData.action([['other'], 'two']);
  actions.RegisterStatic.action([['a'], 'one']);
  actions.RegisterStatic.action([['b'], 'one']);
  assert.deepEqual(state.dataClasses, { one: ['second'], two: ['other'] });
  assert.deepEqual(state.allStatics, { one: ['b'] });
  actions.UnregisterData.action('one');
  actions.UnregisterData.action('missing');
  actions.UnregisterStatic.action('one');
  actions.UnregisterStatic.action('missing');
  assert.deepEqual(state.dataClasses, { two: ['other'] });
  assert.deepEqual(state.allStatics, {});
});
