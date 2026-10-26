import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusJSONLanguageService }, { SettingsManager }] = await loadServerModules([
    'language-services/json/LanguageService.ts', 'settings/Settings.ts',
]);
const service = AventusJSONLanguageService.getInstance();
const uri = 'file:///D:/round222/aventus.conf.avt';
const document = (version, description) => TextDocument.create(uri, 'json', version,
    JSON.stringify({ module: 'Demo', description, build: [{ src: [] }] }));

test('escaped quote followed by slash text in a config string survives a later edit', async t => {
    const previousSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { defaultHideWarnings: false } };
    t.after(() => { SettingsManager.instance = previousSettings; });

    const escaped = document(1, 'say " // keep');
    const escapedDiagnostics = await service.validate({ documentUser: escaped });
    assert.deepEqual(escapedDiagnostics, []);
    assert.equal((await service.getConfig(escaped)).description, 'say " // keep');

    const plain = document(2, 'say // keep');
    assert.deepEqual(await service.validate({ documentUser: plain }), []);
    assert.equal((await service.getConfig(plain)).description, 'say // keep');

    const escapedAgain = document(3, 'new " // value');
    assert.deepEqual(await service.validate({ documentUser: escapedAgain }), []);
    assert.equal((await service.getConfig(escapedAgain)).description, 'new " // value');
});
