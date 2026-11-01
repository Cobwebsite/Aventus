import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const updates = [];
const opened = [];
const previews = [];
globalThis.__aventusMiscNotifications = {
  client: { components: { setLastCompiledInfo: info => updates.push(info), runningServer: { show() {}, hide() {} } }, context: { id: 'extension' } },
  previews,
};
const source = `export { Compiling } from './client/src/notification/sharp/Compiling.ts'; export { CompiledPart } from './client/src/notification/CompiledPart.ts'; export { Compiled } from './client/src/notification/Compiled.ts'; export { OpenPreview } from './client/src/notification/OpenPreview.ts';`;
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'misc-notifications-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'notification-doubles', setup(build) {
    build.onResolve({ filter: /\.\.\/Singleton$|\.\.\/\.\.\/Singleton$|\.\.\/file-system\/DebugFile$|\.\.\/\.\.\/file-system\/DebugFile$|\.\.\/webview\/preview$|\.\/InitStep$/ }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: args.path.endsWith('Singleton')
      ? 'export const Singleton = { client: globalThis.__aventusMiscNotifications.client };'
      : args.path.endsWith('InitStep')
        ? 'export const InitStep = { isDone: true };'
      : args.path.endsWith('DebugFile')
        ? 'export const DebugFile = { schema: "avdebug" };'
        : 'export class AventusPeview { getPreview(context, script) { globalThis.__aventusMiscNotifications.previews.push([context, script]); } }', loader: 'js' }));
  } }],
});
const vscode = {
  ThemeColor: class { constructor(id) { this.id = id; } },
  Uri: { parse: value => ({ value }) },
  window: { showTextDocument(uri) { opened.push(uri); } },
};
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { Compiling, CompiledPart, Compiled, OpenPreview } = module.exports;

test('Sharp compilation status moves through progress, failure and success', () => {
  CompiledPart.action('Preparing');
  assert.deepEqual(updates.at(-1), { text: '$(loading~spin) Preparing' });
  Compiling.action('Backend', 'compiling');
  assert.deepEqual(updates.at(-1), { text: '$(loading~spin) Compiling Backend' });
  Compiling.action('Backend', 'error', [{ file: 'backend/one', title: 'Bad type' }]);
  assert.equal(updates.at(-1).command, 'aventus.openfile.debugsharp');
  assert.equal(updates.at(-1).backgroundColor.id, 'statusBarItem.errorBackground');
  Compiling.openDebug();
  assert.deepEqual(opened, [{ value: 'avdebug:backend/one' }]);
  Compiling.action('Backend', 'success');
  assert.match(updates.at(-1).text, /^\$\(issue-closed\) Backend compiled at \d\d:\d\d:\d\d$/);
});

test('preview notification opens only when an extension context exists', () => {
  OpenPreview.action({ script: 'file:///app.js', style: 'file:///app.css', html: 'file:///app.html' });
  assert.deepEqual(previews, [[{ id: 'extension' }, 'file:///app.js']]);
  globalThis.__aventusMiscNotifications.client.context = undefined;
  OpenPreview.action({ script: 'file:///ignored.js', style: '', html: '' });
  assert.equal(previews.length, 1);
});

test('Sharp and Aventus compilation notifications overwrite their shared status in arrival order', () => {
  Compiled.action('web');
  assert.match(updates.at(-1).text, /web compiled at/);
  Compiling.action('Backend', 'compiling');
  assert.equal(updates.at(-1).text, '$(loading~spin) Compiling Backend');
  Compiled.action('web', [{ file: 'web/broken', title: 'Broken' }]);
  assert.equal(updates.at(-1).command, 'aventus.openfile.debug');
  Compiling.action('Backend', 'success');
  assert.match(updates.at(-1).text, /Backend compiled at/);
  Compiled.render();
  assert.equal(updates.at(-1).command, 'aventus.openfile.debug');
});
