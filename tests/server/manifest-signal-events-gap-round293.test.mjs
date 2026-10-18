import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { Manifest }, { AventusWebComponentLogicalFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts', 'GenericServer.ts',
]);

test('parsed Signal revisions currently expose no events in component manifests', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/Card.wcl.avt';
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
    file._componentClassName = 'Card';
    file._compileResult = [{ classScript: 'Demo.Card', tagName: 'demo-card' }];
    build.tsFiles[uri] = file;
    const manifest = new Manifest({}, build);
    const update = (version, signal) => {
        const document = TextDocument.create(uri, 'typescript', version,
            `export class Card { /** Published state. */ @Signal() public ${signal}: string = ''; }`);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        manifest.register(file);
        const declaration = manifest.customElements._package.modules[0].declarations[0];
        const webType = manifest.webTypes._package.contributions.html.elements[0];
        return { declaration, webType };
    };

    for (const [version, signal] of [[1, 'message'], [2, 'notice']]) {
        const { declaration, webType } = update(version, signal);
        assert.equal(declaration.events?.length ?? 0, 0);
        assert.equal(webType.js?.events?.length ?? 0, 0);
    }
});
