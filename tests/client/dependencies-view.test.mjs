import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const result = await build({ entryPoints: ['client/src/webview/dependances.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const panels = [];
const vscode = {
  ViewColumn: { Active: 1 },
  Uri: { joinPath(base, ...parts) { return { path: [base.path, ...parts].join('/') }; } },
  window: { createWebviewPanel(...args) {
    const panel = { webview: { cspSource: 'vscode-resource:', asWebviewUri: () => ({ toString: () => 'vscode-webview:/configuration' }) } };
    panels.push({ args, panel });
    return panel;
  } },
};
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { AventusDependenciesView } = module.exports;

test('dependencies view creates a panel whose active HTML uses root-relative assets', () => {
  const context = { extensionUri: { path: '/' + process.cwd().replace(/\\/g, '/') } };
  const panel = new AventusDependenciesView().getView(context, 'file:///aventus.conf.avt');
  assert.equal(panel, panels.at(-1).panel);
  assert.deepEqual(panels.at(-1).args.slice(0, 2), ['avt-dependencies-view', 'Dependencies']);
  assert.deepEqual(panels.at(-1).args[3], { enableScripts: true, retainContextWhenHidden: true });
  assert.match(panel.webview.html, /<script src="\/js\/index\.js"><\/script>/);
  assert.match(panel.webview.html, /<link href="\/css\/index\.css"/);
  assert.doesNotMatch(panel.webview.html, /\$nonce|\$csp|~\//);
});

test('dependencies view currently renders the same HTML for different configuration URIs', () => {
  const context = { extensionUri: { path: '/' + process.cwd().replace(/\\/g, '/') } };
  const first = new AventusDependenciesView().getView(context, 'file:///first.conf.avt');
  const second = new AventusDependenciesView().getView(context, 'file:///second.conf.avt');
  assert.equal(first.webview.html.includes('first.conf.avt'), false);
  assert.equal(second.webview.html.includes('second.conf.avt'), false);
});
