import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusJSONLanguageService }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'language-services/json/LanguageService.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);
SettingsManager.instance = { settings: { defaultHideWarnings: true } };
GenericServer.instance = { workspaces: ['file:///D:/app'], logLevel: 4 };
const service = AventusJSONLanguageService.getInstance();

function config(value) {
    return TextDocument.create('file:///D:/app/aventus.conf.avt', 'json', 1, JSON.stringify(value));
}

test('configuration preparation applies defaults and derives the component prefix', async () => {
    const result = await service.getConfig(config({ module: 'DemoApp', build: [{ src: [] }] }));
    assert.equal(result.module, 'DemoApp');
    assert.equal(result.componentPrefix, 'demo-app');
    assert.equal(result.hideWarnings, true);
    assert.equal(result.version, '1.0.0');
    assert.deepEqual(result.aliases, {});
    assert.equal(result.build[0].fullname, 'DemoApp');
    assert.equal(result.build[0].componentPrefix, 'demo-app');
    assert.equal(result.build[0].hideWarnings, true);
});

test('configuration preparation resolves build paths without matching neighboring folders', async () => {
    const result = await service.getConfig(config({
        module: 'Demo', build: [{ name: 'dev', src: ['./src'], compile: [{ input: './src', output: './dist/app.js', outputNpm: './dist/npm' }] }],
    }));
    const build = result.build[0];
    assert.equal(build.fullname, 'Demo@dev');
    assert.deepEqual(build.srcPath, ['D:/app/src']);
    assert.equal(build.srcPathRegex.test('D:/app/src/widget.lib.avt'), true);
    assert.equal(build.srcPathRegex.test('D:/app/src-other/widget.lib.avt'), false);
    assert.equal(build.compile[0].inputPathRegex.test('D:/app/src/widget.lib.avt'), true);
    assert.deepEqual(build.compile[0].outputNpm.path, ['D:/app/dist/npm']);
    assert.equal(build.compile[0].outputNpm.packageJson, true);
    assert.equal(build.compile[0].output[0]['@default'].path, 'D:\\app\\dist\\app.js');
});

test('configuration preparation normalizes static folders and rejects invalid configurations', async () => {
    const result = await service.getConfig(config({
        module: 'Demo', build: [{ src: [] }],
        static: [{ name: 'assets', input: './public/', output: './dist/' }],
    }));
    assert.equal(result.static[0].inputPathFolder, 'D:/app/public');
    assert.deepEqual(result.static[0].outputPathFolder, ['D:/app/dist/']);
    assert.equal(await service.getConfig(config({ module: 'Demo', build: [], invalid: true })), null);
});
