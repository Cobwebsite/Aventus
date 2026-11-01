import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const items = new Map();
let onSettingsChange;
const settings = { ideBuild: true };
const source = `export { AvenutsVsComponent } from './client/src/component/index.ts'; export { Compiled } from './client/src/notification/Compiled.ts'; export { Compiling } from './client/src/notification/sharp/Compiling.ts'; export { Compiling as CompilingPhp } from './client/src/notification/php/Compiling.ts'; export { ServerStart } from './client/src/notification/httpServer/ServerStart.ts'; export { ServerStop } from './client/src/notification/httpServer/ServerStop.ts';`;
const result = await build({ stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'component-status-entry.ts' }, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false,
  plugins: [{ name: 'settings-double', setup(build) {
    build.onResolve({ filter: /\.\.\/Settings$/ }, () => ({ path: 'settings', namespace: 'test' }));
    build.onResolve({ filter: /\.\.\/(?:\.\.\/)?Singleton$/ }, () => ({ path: 'singleton', namespace: 'test' }));
    build.onResolve({ filter: /\.\.\/(?:\.\.\/)?file-system\/DebugFile$|\.\/InitStep$/ }, args => ({ path: args.path, namespace: 'test' }));
    build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: args.path === 'settings'
      ? 'export const SettingsManager = { getInstance: () => globalThis.__aventusComponentSettings };'
      : args.path === 'singleton'
        ? 'export const Singleton = { client: globalThis.__aventusComponentClient };'
        : args.path.endsWith('DebugFile')
          ? 'export const DebugFile = { schema: "avdebug" };'
          : 'export const InitStep = { isDone: true };', loader: 'js' }));
  } }],
});
globalThis.__aventusComponentSettings = { settings, onSettingsChange(callback) { onSettingsChange = callback; } };
globalThis.__aventusComponentClient = {};
class ThemeColor { constructor(id) { this.id = id; } }
const vscode = {
  StatusBarAlignment: { Right: 2 }, ThemeColor,
  window: { createStatusBarItem(name, alignment, priority) {
    const item = { name, alignment, priority, visible: false, show() { this.visible = true; }, hide() { this.visible = false; } };
    items.set(name, item);
    return item;
  } },
};
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { AvenutsVsComponent, Compiled, Compiling, CompilingPhp, ServerStart, ServerStop } = module.exports;

test('status bar follows build enablement and restores last compilation details', () => {
  const component = new AvenutsVsComponent();
  const last = items.get('last-compiled-info');
  const server = items.get('running-server');
  assert.equal(last.visible, true);
  assert.equal(server.visible, false);
  assert.equal(server.command, 'aventus.liveserver.start');
  component.setLastCompiledInfo({ text: 'Compiled', tooltip: 'web ready', command: 'aventus.details' });
  assert.equal(last.text, 'Compiled');
  assert.equal(last.tooltip, 'web ready');
  settings.ideBuild = false;
  onSettingsChange();
  assert.equal(last.text, 'Compilation is disabled');
  assert.equal(last.command, 'aventus.enableBuild');
  assert.equal(last.backgroundColor.id, 'statusBarItem.errorBackground');
  settings.ideBuild = true;
  onSettingsChange();
  assert.equal(last.text, 'Compiled');
  assert.equal(last.tooltip, 'web ready');
  assert.equal(last.command, 'aventus.details');
  assert.equal(last.backgroundColor, undefined);
});

test('compiled notification updates the actual status component through failure and recovery', () => {
  const component = new AvenutsVsComponent();
  globalThis.__aventusComponentClient.components = component;
  const last = items.get('last-compiled-info');
  const server = items.get('running-server');
  Compiled.action('web', [{ file: 'web/error', title: 'Broken' }]);
  assert.equal(last.text, '$(error) You have compilation errors');
  assert.equal(last.command, 'aventus.openfile.debug');
  assert.equal(server.visible, true);
  Compiled.action('web', []);
  assert.match(last.text, /web compiled at/);
  assert.equal(last.command, undefined);
  Compiled.removeBuild('web');
  Compiled.render();
  assert.equal(last.text, '');
  assert.equal(server.visible, false);
});

test('HTTP notifications update the running server item of the actual status component', () => {
  const component = new AvenutsVsComponent();
  globalThis.__aventusComponentClient.components = component;
  const server = items.get('running-server');
  assert.equal(server.command, 'aventus.liveserver.start');
  ServerStart.action('http://localhost:8080');
  assert.equal(server.command, 'aventus.liveserver.stop');
  assert.match(server.tooltip, /localhost:8080/);
  ServerStop.action();
  assert.equal(server.command, 'aventus.liveserver.start');
  assert.equal(server.tooltip, 'Aventus : Start live reload');
});

test('Aventus error remains visible through Sharp success until Aventus recovers', () => {
  const component = new AvenutsVsComponent();
  globalThis.__aventusComponentClient.components = component;
  const last = items.get('last-compiled-info');
  Compiled.action('web', [{ file: 'web/error', title: 'Broken' }]);
  assert.equal(last.command, 'aventus.openfile.debug');
  Compiling.action('Backend', 'success');
  assert.equal(last.command, 'aventus.openfile.debug');
  Compiled.action('web', []);
  assert.match(last.text, /web compiled at/);
  assert.equal(last.command, undefined);
  Compiled.removeBuild('web');
  Compiled.render();
});

test('simultaneous Aventus and Sharp errors are both described', () => {
  const component = new AvenutsVsComponent();
  globalThis.__aventusComponentClient.components = component;
  const last = items.get('last-compiled-info');
  Compiled.action('web', [{ file: 'web/error', title: 'Broken' }]);
  Compiling.action('Backend', 'error', [{ file: 'backend/error', title: 'Failed' }]);
  assert.equal(last.command, 'aventus.openfile.debug');
  assert.match(last.tooltip, /Aventus:[\s\S]*Broken/);
  assert.match(last.tooltip, /Sharp: Failed/);
  Compiled.action('web', []);
  assert.equal(last.command, 'aventus.openfile.debugsharp');
  Compiling.action('Backend', 'success');
  assert.equal(last.command, undefined);
  Compiled.removeBuild('web');
  Compiled.render();
});

test('PHP status is independent from Sharp and its error clears after PHP success', () => {
  const component = new AvenutsVsComponent();
  globalThis.__aventusComponentClient.components = component;
  const last = items.get('last-compiled-info');
  CompilingPhp.action('site', 'compiling');
  assert.match(last.text, /Compiling site/);
  CompilingPhp.action('site', 'error', [{ file: 'site/error', title: 'PHP failed' }]);
  assert.match(last.text, /site compilation errors/);
  assert.equal(last.command, 'aventus.openfile.debugphp');
  Compiling.action('backend', 'success');
  assert.match(last.text, /site compilation errors/);
  assert.equal(last.command, 'aventus.openfile.debugphp');
  CompilingPhp.action('site', 'success');
  assert.equal(last.command, undefined);
  assert.match(last.text, /site compiled at/);
});
