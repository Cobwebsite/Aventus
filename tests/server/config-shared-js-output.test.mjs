import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusJSONLanguageService }, { SettingsManager }] = await loadServerModules([
    'language-services/json/LanguageService.ts', 'settings/Settings.ts',
]);

test('active compilation units sharing a JS output diagnose both config values', async t => {
    const previousSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { defaultHideWarnings: false } };
    t.after(() => { SettingsManager.instance = previousSettings; });
    const service = AventusJSONLanguageService.getInstance();
    const uri = 'file:///D:/project/aventus.conf.avt';
    const makeFile = (version, builds) => {
        const content = JSON.stringify({ module: 'Demo', build: builds });
        return { documentUser: TextDocument.create(uri, 'json', version, content) };
    };
    const first = { name: 'first', src: [], compile: [{ output: './dist/shared.js' }] };
    const second = { name: 'second', src: [], compile: [{ output: 'dist/shared.js' }] };
    const collision = makeFile(1, [first, second]);
    const diagnostics = await service.validate(collision);
    assert.equal(diagnostics.length, 2);
    assert.deepEqual(diagnostics.map(item => collision.documentUser.getText(item.range)),
        ['"./dist/shared.js"', '"dist/shared.js"']);
    assert.ok(diagnostics.every(item => /same JavaScript output/.test(item.message)));
    assert.equal(await service.getConfig(collision), null);

    const sameBuild = makeFile(2, [{ name: 'first', src: [], compile: [
        { output: './dist/shared.js' }, { output: { '@default': { path: 'dist/shared.js' } } },
    ] }]);
    const sameBuildDiagnostics = await service.validate(sameBuild);
    assert.deepEqual(sameBuildDiagnostics.map(item => sameBuild.documentUser.getText(item.range)),
        ['"./dist/shared.js"', '"dist/shared.js"']);
    assert.equal(await service.getConfig(sameBuild), null);

    const threeUnits = makeFile(3, [first, second, {
        name: 'third', src: [], compile: [{ output: './dist/shared.js' }],
    }]);
    const threeDiagnostics = await service.validate(threeUnits);
    assert.equal(threeDiagnostics.length, 3, JSON.stringify(threeDiagnostics.map(item => [item.message, threeUnits.documentUser.getText(item.range)])));
    assert.deepEqual(threeDiagnostics.map(item => threeUnits.documentUser.getText(item.range)),
        ['"./dist/shared.js"', '"dist/shared.js"', '"./dist/shared.js"']);

    const disabled = makeFile(4, [first, { ...second, disabled: true }]);
    assert.deepEqual(await service.validate(disabled), []);
    assert.ok(await service.getConfig(disabled));

    const combined = makeFile(5, [{ name: 'combined', src: [], compile: [{ output: {
        '@default': './dist/shared.js', '@npm': './dist/shared.js',
    } }] }]);
    assert.deepEqual(await service.validate(combined), []);
    assert.ok(await service.getConfig(combined));
});
