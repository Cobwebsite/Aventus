import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusJSONLanguageService }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'language-services/json/LanguageService.ts', 'settings/Settings.ts', 'GenericServer.ts',
]);

test('a static output inside its input is omitted while valid statics remain', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-static-recursive-output-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousSettings = SettingsManager.instance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
    });
    SettingsManager.instance = { settings: { defaultHideWarnings: false } };
    const messages = [];
    GenericServer.instance = { logLevel: 99, connection: { showErrorMessage: message => messages.push(message) } };

    const input = join(root, 'input');
    const output = join(input, 'generated');
    const validOutput = join(root, 'dist');
    mkdirSync(input);
    const uri = pathToFileURL(join(root, 'aventus.conf.avt')).href;
    const source = destination => JSON.stringify({
        module: 'Demo', build: [{ name: 'web', src: [] }],
        static: [
            { name: 'assets', input: './input', output: destination },
            { name: 'other', input: './input', output: validOutput },
        ],
    });
    const diagnostics = [];
    const parse = (version, destination) => AventusJSONLanguageService.getInstance().getConfig(
        TextDocument.create(uri, 'json', version, source(destination)), diagnostics);

    const invalid = await parse(1, output);
    assert.ok(invalid, JSON.stringify(diagnostics));
    assert.deepEqual(invalid.static.map(item => item.name), ['other']);
    assert.equal(invalid.build.length, 1);
    assert.equal(messages.length, 1);
    assert.match(messages[0], /Static assets: output .* is inside input /);

    const corrected = await parse(2, validOutput);
    assert.ok(corrected);
    assert.deepEqual(corrected.static.map(item => item.name), ['assets', 'other']);
});
