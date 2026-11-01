import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const result = await build({ entryPoints: ['client/src/webview/preview.ts'], absWorkingDir: process.cwd(), bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false });
const panels = [];
const vscode = {
  ViewColumn: { Beside: 2 },
  Uri: { joinPath(base, ...parts) { return { path: [base.path, ...parts].join('/') }; } },
  window: { createWebviewPanel(...args) {
    const panel = { webview: { cspSource: 'vscode-resource:', asWebviewUri: () => ({ toString: () => 'vscode-webview:/preview' }) } };
    panels.push({ args, panel });
    return panel;
  } },
};
const module = { exports: {} };
new Function('module', 'exports', 'require', result.outputFiles[0].text)(module, module.exports, name => name === 'vscode' ? vscode : require(name));
const { AventusPeview } = module.exports;

test('preview panel creation currently fails because its HTML template is absent', () => {
  const context = { extensionUri: { path: '/' + process.cwd().replace(/\\/g, '/') } };
  assert.throws(() => new AventusPeview().getPreview(context, 'file:///app.js'), error => error.code === 'ENOENT' && /views[\\/]preview[\\/]index\.html/.test(error.path));
  assert.deepEqual(panels.at(-1).args.slice(0, 2), ['avt-preview', 'Preview']);
  assert.equal(panels.at(-1).args[2].viewColumn, 2);
  assert.equal(panels.at(-1).panel.webview.html, undefined);
});
