import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusJSONLanguageService }, { SettingsManager }] = await loadServerModules([
    'language-services/json/LanguageService.ts', 'settings/Settings.ts',
]);
const service = AventusJSONLanguageService.getInstance();
const uri = 'file:///D:/round230/aventus.conf.avt';
const document = (version, comment) => TextDocument.create(uri, 'json', version,
    `{\n  "module": "Demo", // ${comment}\n  "build": [{"src": []}]\n}`);

test('configuration line comments with punctuation recover after editing', async t => {
    const previousSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { defaultHideWarnings: false } };
    t.after(() => { SettingsManager.instance = previousSettings; });

    const simple = document(1, 'simple');
    assert.deepEqual(await service.validate({ documentUser: simple }), []);
    assert.equal((await service.getConfig(simple)).module, 'Demo');

    const punctuation = document(2, 'details (optional)');
    assert.deepEqual(await service.validate({ documentUser: punctuation }), []);
    assert.equal((await service.getConfig(punctuation)).module, 'Demo');

    const corrected = document(3, 'details optional');
    assert.deepEqual(await service.validate({ documentUser: corrected }), []);
    assert.equal((await service.getConfig(corrected)).module, 'Demo');
});
