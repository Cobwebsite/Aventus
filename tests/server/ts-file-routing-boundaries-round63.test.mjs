import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { InternalAventusFile }, { GenericServer }, { AventusTsFileSelector }] = await loadServerModules([
    'project/Build.ts', 'files/AventusFile.ts', 'GenericServer.ts', 'language-services/ts/FileSelector.ts',
]);

function file(uri) {
    return new InternalAventusFile(TextDocument.create(uri, 'Aventus Ts', 1, ''));
}

function build() {
    const current = Object.create(Build.prototype);
    Object.assign(current, {
        tsFiles: {}, wcFiles: {}, htmlFiles: {}, scssFiles: {}, globalComponentSCSSFiles: {},
        i18nComponentsFiles: {}, onFileDeleteUUIDs: {},
        tsLanguageService: { addFile() {}, removeFile() {}, i18nFiles: {} },
        scssLanguageService: { removeInternalDefinition() {}, removeExternalDefinition() {} },
        htmlLanguageService: { removeInternalDefinition() {}, removeInternalTagUri() {}, removeExternalDefinition() {} },
        externalPackageInformation: { rebuild() {} }, npmBuilder: { unregister() {} },
        buildConfig: {}, project: { isCoreBuild: false },
        getNamespace: () => '', getComponentPrefix: () => 'demo', rebuildAll: async () => {},
    });
    return current;
}

test('TypeScript selector and Build keep near-matching and separately owned files out of the TS cache', async () => {
    const previous = GenericServer.instance;
    GenericServer.instance = { logLevel: 99, isIDE: true, connection: { sendDiagnostics() {} } };
    const current = build();
    try {
        const excluded = [
            'entry.wcl.avt.bak', 'entry.wcl.avtx', 'entry.WCL.avt', 'entry.data.avt.ts',
            'entry.package.avt', 'template.avt.ts', 'entry.template.avt', 'entry.unknown.avt',
        ];
        for (const name of excluded) {
            const source = file(`file:///D:/round63/${name}`);
            assert.equal(AventusTsFileSelector(source, current), null, name);
            await current.registerFile(source, true);
            assert.equal(current.tsFiles[source.uri], undefined, name);
            assert.equal(current.onFileDeleteUUIDs[source.uri], undefined, name);
        }

        const supported = [
            ['entry.wcl.avt', 'AventusWebComponentLogicalFile'],
            ['entry.data.avt', 'AventusDataFile'],
            ['entry.lib.avt', 'AventusLibFile'],
            ['entry.ram.avt', 'AventusRamFile'],
            ['entry.state.avt', 'AventusStateFile'],
            ['entry.static.avt', 'AventusStaticFile'],
            ['entry.def.avt', 'AventusDefinitionFile'],
        ];
        for (const [name, className] of supported) {
            const source = file(`file:///D:/round63/${name}`);
            await current.registerFile(source, true);
            assert.ok(current.tsFiles[source.uri]?.constructor.name.endsWith(className), name);
            assert.equal(current.tsFiles[source.uri]?.file, source, name);
            assert.ok(current.onFileDeleteUUIDs[source.uri], name);
            await source.triggerDelete();
            assert.equal(current.tsFiles[source.uri], undefined, name);
        }
        assert.deepEqual(Object.keys(current.tsFiles), []);
    } finally {
        GenericServer.instance = previous;
    }
});
