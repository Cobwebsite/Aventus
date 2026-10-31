import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusJSONLanguageService }, { SettingsManager }] = await loadServerModules([
    'language-services/json/LanguageService.ts', 'settings/Settings.ts',
]);
const service = AventusJSONLanguageService.getInstance();
const uri = 'file:///D:/round241/aventus.conf.avt';
const document = (version, content) => TextDocument.create(uri, 'json', version, content);

test('trailing commas in a build and top-level config recover after edits', async t => {
    const previousSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { defaultHideWarnings: false } };
    t.after(() => { SettingsManager.instance = previousSettings; });

    const valid = document(1, '{"module":"Demo","build":[{"name":"first","src":[]}]}');
    assert.deepEqual(await service.validate({ documentUser: valid }), []);
    assert.equal((await service.getConfig(valid)).build[0].name, 'first');

    const nestedComma = document(2, '{"module":"Demo","build":[{"name":"first","src":[],}]}');
    const nestedErrors = await service.validate({ documentUser: nestedComma });
    assert.ok(nestedErrors.some(error => error.message === 'Trailing comma' && error.code === 519));
    assert.equal(await service.getConfig(nestedComma), null);

    const topComma = document(3, '{"module":"Demo","build":[{"name":"first","src":[]},],}');
    const topErrors = await service.validate({ documentUser: topComma });
    assert.equal(topErrors.filter(error => error.message === 'Trailing comma' && error.code === 519).length, 2);
    assert.equal(await service.getConfig(topComma), null);

    const fixed = document(4, '{"module":"Demo","build":[{"name":"second","src":[]}]}');
    assert.deepEqual(await service.validate({ documentUser: fixed }), []);
    assert.equal((await service.getConfig(fixed)).build[0].name, 'second');
});
