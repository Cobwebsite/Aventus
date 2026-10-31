import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { Manifest }, { AventusWebComponentLogicalFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts', 'GenericServer.ts',
]);

test('removing a parsed component class removes only its entries from every manifest format', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4 };
    const build = {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
        npmBuilder: { unregister() {} }, hasNpmOutput: false, noNamespaceUri: {},
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        tsFiles: {}, htmlFiles: {}, scssFiles: {},
        externalPackageInformation: { getByUri: () => undefined },
    };
    const manifest = new Manifest({}, build);
    const component = name => {
        const uri = `file:///project/${name}.wcl.avt`;
        const file = Object.create(AventusWebComponentLogicalFile.prototype);
        file._file = { uri };
        file._build = build;
        file._componentClassName = name;
        file._compileResult = [{ classScript: `Demo.${name}`, tagName: `demo-${name.toLowerCase()}` }];
        build.tsFiles[uri] = file;
        return file;
    };
    const update = (file, version, source) => {
        const uri = file.file.uri;
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        manifest.register(file);
    };
    const card = component('Card');
    const panel = component('Panel');
    update(card, 1, 'export class Card { @Attribute() mode: "small" | "large" = "small"; }');
    update(panel, 1, 'export class Panel { @Attribute() state: "ready" | "busy" = "ready"; }');
    const snapshot = () => ({
        custom: manifest.customElements._package.modules.map(module => module.declarations[0].tagName),
        html: manifest.htmlCustomData._package.tags.map(tag => tag.name),
        web: manifest.webTypes._package.contributions.html.elements.map(element => element.name),
        emmet: Object.keys(manifest.emmetCustomData._package.html.snippets),
    });
    for (const entries of Object.values(snapshot())) assert.deepEqual(entries.sort(), ['demo-card', 'demo-panel']);

    update(card, 2, 'export class RetiredCard { @Attribute() oldMode: string = "old"; }');
    for (const entries of Object.values(snapshot())) assert.deepEqual(entries, ['demo-panel']);
    assert.deepEqual(manifest.htmlCustomData._package.tags[0].attributes.map(attribute => attribute.name), ['state']);
    assert.deepEqual(manifest.webTypes._package.contributions.html.elements[0].attributes[0].values,
        [{ type: 'ready' }, { type: 'busy' }]);
});
