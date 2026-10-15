import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { Manifest }, { AventusWebComponentLogicalFile }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

test('parsed component edits replace serialized attribute values in all four manifest outputs', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-manifest-parsed-write-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    t.after(() => { GenericServer.instance = previousServer; SettingsManager.instance = previousSettings; });
    GenericServer.instance = { logLevel: 4 };
    SettingsManager.instance = { settings: { useStats: false } };
    const uri = 'file:///project/Status.wcl.avt';
    const build = {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
        npmBuilder: { unregister() {} }, hasNpmOutput: false, noNamespaceUri: {},
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        tsFiles: {}, htmlFiles: {}, scssFiles: {},
        externalPackageInformation: { getByUri: () => undefined },
    };
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri };
    file._build = build;
    file._componentClassName = 'Status';
    file._compileResult = [{ classScript: 'Demo.Status', tagName: 'demo-status' }];
    build.tsFiles[uri] = file;
    const manifest = new Manifest({}, build);
    const write = async (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        manifest.register(file);
        await manifest.write(root);
        const read = name => JSON.parse(readFileSync(join(root, name), 'utf8'));
        return {
            custom: read('custom-elements.json'),
            web: read('web-types.json'),
            html: read('vscode.html-custom-data.json'),
            emmet: read(join('emmet', 'snippets.json')),
        };
    };

    const first = await write(1, `/** First status. */ export class Status {
        @Attribute() public state: 'idle' | 'busy' = 'idle';
    }`);
    assert.deepEqual(first.html.tags[0].attributes[0].values, [{ name: 'idle' }, { name: 'busy' }]);
    assert.deepEqual(first.web.contributions.html.elements[0].attributes[0].values, [{ type: 'idle' }, { type: 'busy' }]);
    assert.deepEqual(Object.keys(first.emmet.html.snippets), ['demo-status']);

    const second = await write(2, `/** New status. */ export class Status {
        @Attribute() public phase: 'start' | 'done' = 'start';
    }`);
    assert.deepEqual(second.custom.modules[0].declarations[0].attributes.map(attribute => attribute.name), ['phase']);
    assert.deepEqual(second.html.tags[0].attributes[0].values, [{ name: 'start' }, { name: 'done' }]);
    assert.deepEqual(second.web.contributions.html.elements[0].attributes[0].values, [{ type: 'start' }, { type: 'done' }]);
    assert.deepEqual(Object.keys(second.emmet.html.snippets), ['demo-status']);
    for (const name of ['custom-elements.json', 'web-types.json', 'vscode.html-custom-data.json']) {
        assert.doesNotMatch(readFileSync(join(root, name), 'utf8'), /idle|busy|First status/);
    }
});
