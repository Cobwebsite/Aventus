import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { Manifest }, { AventusWebComponentLogicalFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts', 'GenericServer.ts',
]);

test('renaming a parsed component class replaces its entries in all four manifests', t => {
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
    build.tsFiles[uri] = file;
    const manifest = new Manifest({}, build);
    const update = (version, className, tag, attribute) => {
        const source = `export class ${className} { @Attribute() ${attribute}: string = "ready"; }`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        file._componentClassName = className;
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        file._compileResult = [{ classScript: `Demo.${className}`, tagName: tag }];
        manifest.register(file);
    };
    const snapshot = () => ({
        custom: manifest.customElements._package.modules[0].declarations.map(item => [item.name, item.tagName, item.attributes.map(value => value.name)]),
        html: manifest.htmlCustomData._package.tags.map(item => [item.name, item.attributes.map(value => value.name)]),
        web: manifest.webTypes._package.contributions.html.elements.map(item => [item.name, item.attributes.map(value => value.name)]),
        emmet: Object.keys(manifest.emmetCustomData._package.html.snippets),
    });
    update(1, 'Card', 'demo-card', 'mode');
    assert.deepEqual(snapshot(), {
        custom: [['Card', 'demo-card', ['mode']]],
        html: [['demo-card', ['mode']]],
        web: [['demo-card', ['mode']]],
        emmet: ['demo-card'],
    });
    update(2, 'Panel', 'demo-panel', 'size');
    assert.deepEqual(snapshot(), {
        custom: [['Panel', 'demo-panel', ['size']]],
        html: [['demo-panel', ['size']]],
        web: [['demo-panel', ['size']]],
        emmet: ['demo-panel'],
    });
});
