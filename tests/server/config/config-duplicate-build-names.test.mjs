import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusJSONLanguageService }, { SettingsManager }] = await loadServerModules([
    'language-services/json/LanguageService.ts', 'settings/Settings.ts',
]);

test('duplicate effective build names are diagnosed in the config and rejected', async t => {
    const previousSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { defaultHideWarnings: false } };
    t.after(() => { SettingsManager.instance = previousSettings; });
    const service = AventusJSONLanguageService.getInstance();
    const uri = 'file:///workspace/aventus.conf.avt';
    const makeFile = (version, builds) => {
        const content = JSON.stringify({ module: 'Shared', build: builds });
        return { documentUser: TextDocument.create(uri, 'json', version, content) };
    };

    const duplicate = makeFile(1, [{ name: 'web', src: [] }, { name: 'web', src: [] }]);
    const diagnostics = await service.validate(duplicate);
    assert.equal(diagnostics.length, 1);
    assert.match(diagnostics[0].message, /Duplicate build: Shared@web/);
    assert.equal(duplicate.documentUser.getText(diagnostics[0].range), '"web"');
    const loadDiagnostics = [];
    assert.equal(await service.getConfig(duplicate, loadDiagnostics), null);
    assert.deepEqual(loadDiagnostics, diagnostics);

    const distinct = makeFile(2, [{ name: 'web', src: [] }, { name: 'web', module: 'Other', src: [] }]);
    assert.deepEqual(await service.validate(distinct), []);
    assert.deepEqual((await service.getConfig(distinct)).build.map(build => build.fullname), ['Shared@web', 'Other@web']);
});
