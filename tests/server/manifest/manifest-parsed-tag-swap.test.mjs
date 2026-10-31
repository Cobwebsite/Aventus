import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { Manifest }, { AventusWebComponentLogicalFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts', 'GenericServer.ts',
]);

test('two parsed components exchange tags and later retire one without stale manifest entries', t => {
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
    const makeComponent = name => {
        const uri = `file:///project/${name}.wcl.avt`;
        const file = Object.create(AventusWebComponentLogicalFile.prototype);
        file._file = { uri };
        file._build = build;
        file._componentClassName = name;
        build.tsFiles[uri] = file;
        return file;
    };
    const update = (file, version, tag, attribute) => {
        const uri = file.file.uri;
        const source = `export class ${file.componentClassName} { @Attribute() ${attribute}: string = "ready"; }`;
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        file._compileResult = [{ classScript: `Demo.${file.componentClassName}`, tagName: tag }];
        manifest.register(file);
    };
    const card = makeComponent('Card');
    const panel = makeComponent('Panel');
    const sorted = entries => entries.sort((a, b) => a.tag.localeCompare(b.tag));
    const snapshot = () => ({
        custom: sorted(manifest.customElements._package.modules.flatMap(module => module.declarations.map(item => ({ tag: item.tagName, attributes: item.attributes.map(value => value.name) })))),
        html: sorted(manifest.htmlCustomData._package.tags.map(item => ({ tag: item.name, attributes: item.attributes.map(value => value.name) }))),
        web: sorted(manifest.webTypes._package.contributions.html.elements.map(item => ({ tag: item.name, attributes: item.attributes.map(value => value.name) }))),
        emmet: Object.keys(manifest.emmetCustomData._package.html.snippets).sort(),
    });
    const expectEntries = (entries) => {
        const state = snapshot();
        for (const kind of ['custom', 'html', 'web']) assert.deepEqual(state[kind], entries);
        assert.deepEqual(state.emmet, entries.map(item => item.tag));
    };

    update(card, 1, 'demo-card', 'cardMode');
    update(panel, 1, 'demo-panel', 'panelMode');
    expectEntries([
        { tag: 'demo-card', attributes: ['cardMode'] },
        { tag: 'demo-panel', attributes: ['panelMode'] },
    ]);

    // Move one tag out of the way before assigning it to the other component.
    update(panel, 2, 'demo-spare', 'panelState');
    update(card, 2, 'demo-panel', 'cardState');
    update(panel, 3, 'demo-card', 'panelSize');
    expectEntries([
        { tag: 'demo-card', attributes: ['panelSize'] },
        { tag: 'demo-panel', attributes: ['cardState'] },
    ]);

    manifest.unregister(card.file.uri);
    expectEntries([{ tag: 'demo-card', attributes: ['panelSize'] }]);
});
