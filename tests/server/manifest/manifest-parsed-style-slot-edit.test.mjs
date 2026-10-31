import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { Manifest }, { AventusWebComponentLogicalFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts', 'GenericServer.ts',
]);

test('parsed component manifest refreshes CSS variables and view slots across four formats', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/Card.wcl.avt';
    const viewUri = 'file:///project/Card.wcv.avt';
    const styleUri = 'file:///project/Card.wcs.avt';
    const build = {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
        npmBuilder: { unregister() {} }, hasNpmOutput: false, noNamespaceUri: {},
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        tsFiles: {},
        htmlFiles: { [viewUri]: { fileParsed: { slotsInfo: { header: {} }, blocksInfo: {} } } },
        scssFiles: { [styleUri]: { customProperties: [{ name: '--card-color', type: '<color>', defaultValue: 'red', documentation: 'Foreground' }] } },
        externalPackageInformation: { getByUri: () => undefined },
    };
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri };
    file._build = build;
    file._componentClassName = 'Card';
    file._compileResult = [{ classScript: 'Demo.Card', tagName: 'demo-card' }];
    build.tsFiles[uri] = file;
    const manifest = new Manifest({}, build);
    const register = version => {
        const document = TextDocument.create(uri, 'typescript', version, 'export class Card { @Attribute() mode: string = "ready"; }');
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        manifest.register(file);
    };
    const snapshot = () => ({
        custom: manifest.customElements._package.modules[0].declarations[0],
        html: manifest.htmlCustomData._package.tags[0],
        web: manifest.webTypes._package.contributions.html.elements[0],
        emmet: manifest.emmetCustomData._package.html.snippets,
    });

    register(1);
    const first = snapshot();
    assert.deepEqual(first.custom.cssProperties.map(item => item.name), ['--card-color']);
    assert.deepEqual(first.custom.slots.map(item => item.name), ['header']);
    assert.deepEqual(first.web.slots.map(item => item.name), ['header']);
    assert.deepEqual(first.html.attributes.map(item => item.name), ['mode']);
    assert.deepEqual(Object.keys(first.emmet), ['demo-card']);

    build.scssFiles[styleUri].customProperties = [{ name: '--card-size', type: '<length>', defaultValue: '2rem', documentation: 'Size' }];
    build.htmlFiles[viewUri].fileParsed.slotsInfo = { footer: {} };
    register(2);
    const second = snapshot();
    assert.deepEqual(second.custom.cssProperties, [{ name: '--card-size', default: '2rem', description: 'Size', syntax: '<length>' }]);
    assert.deepEqual(second.custom.slots.map(item => item.name), ['footer']);
    assert.deepEqual(second.web.slots.map(item => item.name), ['footer']);
    assert.deepEqual(second.html.attributes.map(item => item.name), ['mode']);
    assert.deepEqual(Object.keys(second.emmet), ['demo-card']);
});
