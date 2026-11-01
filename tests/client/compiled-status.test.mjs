import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const updates = [];
const opened = [];
let shown = 0;
let hidden = 0;
const components = {
  runningServer: { show() { shown++; }, hide() { hidden++; } },
  setLastCompiledInfo(info) { updates.push(info); },
};
globalThis.__aventusCompiledTest = { client: { components } };
const result = await build({ entryPoints: ['client/src/notification/Compiled.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'compiled-doubles', setup(build) {
    build.onResolve({ filter: /\.\.\/Singleton$|\.\.\/file-system\/DebugFile$|\.\/InitStep$/ }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: args.path.endsWith('Singleton')
      ? 'export const Singleton = globalThis.__aventusCompiledTest;'
      : args.path.endsWith('DebugFile')
        ? 'export const DebugFile = { schema: "avdebug" };'
        : 'export const InitStep = { isDone: true };', loader: 'js' }));
  } }],
});
const vscode = {
  ThemeColor: class { constructor(id) { this.id = id; } },
  Uri: { parse: value => ({ value }) },
  window: { showTextDocument(uri) { opened.push(uri); } },
};
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { Compiled } = module.exports;

test('compiled status changes from success to error and opens matching debug files', () => {
  Compiled.action('web');
  assert.deepEqual(Compiled.getBuilds(), ['web']);
  assert.match(updates.at(-1).text, /^\$\(issue-closed\) web compiled at \d\d:\d\d:\d\d$/);
  const failure = [{ file: 'web/one', title: 'Missing class' }, { file: 'web/two', title: 'Invalid property' }];
  Compiled.action('web', failure);
  assert.equal(updates.at(-1).text, '$(error) You have compilation errors');
  assert.equal(updates.at(-1).command, 'aventus.openfile.debug');
  Compiled.openDebug('web');
  assert.deepEqual(opened, [{ value: 'avdebug:web/one' }, { value: 'avdebug:web/two' }]);
  Compiled.action('web', []);
  assert.match(updates.at(-1).text, /^\$\(issue-closed\)/);
  assert.ok(shown >= 3);
});

test('removeBuild currently leaves running-server status visible after last build is removed', () => {
  const beforeHide = hidden;
  Compiled.removeBuild('web');
  assert.deepEqual(Compiled.getBuilds(), []);
  assert.equal(hidden, beforeHide);
  assert.match(updates.at(-1).text, /^\$\(issue-closed\)/);
  Compiled.render();
  assert.equal(hidden, beforeHide + 1);
  assert.deepEqual(updates.at(-1), { text: '' });
});
