import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusJSONLanguageService }, { SettingsManager }] = await loadServerModules([
    'language-services/json/LanguageService.ts', 'settings/Settings.ts',
]);
const service = AventusJSONLanguageService.getInstance();
const uri = 'file:///round219/aventus.conf.avt';
const document = (text, version) => TextDocument.create(uri, 'json', version, text);

test('configuration parser accepts multiline block comments across revisions', async t => {
    const previousSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { defaultHideWarnings: false } };
    t.after(() => { SettingsManager.instance = previousSettings; });
    const multiline = document('{"module":"Demo", /* first line\n second line */ "build":[{"src":[]}]}', 1);
    const multilineFile = { documentUser: multiline };
    const diagnostics = await service.validate(multilineFile);
    assert.deepEqual(diagnostics, []);
    assert.equal((await service.getConfig(multiline)).module, 'Demo');

    const compact = document('{"module":"Demo", /* one line */ "build":[{"src":[]}]}', 2);
    assert.deepEqual(await service.validate({ documentUser: compact }), []);
    const recovered = await service.getConfig(compact);
    assert.equal(recovered.module, 'Demo');
    assert.equal(recovered.build.length, 1);

    const withoutComment = document('{"module":"Demo","build":[{"src":[]}]}', 3);
    assert.deepEqual(await service.validate({ documentUser: withoutComment }), []);
    assert.equal((await service.getConfig(withoutComment)).module, 'Demo');
});
