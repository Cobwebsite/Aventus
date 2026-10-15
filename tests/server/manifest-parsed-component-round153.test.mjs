import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { Manifest }, { AventusWebComponentLogicalFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts', 'GenericServer.ts',
]);

test('parsed component attributes and properties refresh all manifest formats after source edit', t => {
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
    const update = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        manifest.register(file);
    };

    update(1, `/** A card. */ export class Card {
        @Attribute() mode: "small" | "large" = "small";
        public active: boolean = true;
        /** Opens card. */ open(force?: boolean): string { return "open"; }
    }`);
    const first = manifest.customElements._package.modules[0].declarations[0];
    assert.deepEqual(first.attributes.map(attribute => attribute.name), ['mode']);
    assert.deepEqual(first.members.map(member => member.name), ['active', 'open']);
    assert.deepEqual(first.members[1].parameters, [{ name: 'force', type: { text: 'boolean' }, optional: true }]);
    assert.equal(first.members[1].return.type.text, 'string');
    assert.deepEqual(manifest.htmlCustomData._package.tags[0].attributes.map(attribute => attribute.name), ['mode']);
    assert.deepEqual(manifest.htmlCustomData._package.tags[0].attributes[0].values,
        [{ name: 'small' }, { name: 'large' }]);
    assert.deepEqual(manifest.webTypes._package.contributions.html.elements[0].js.properties.map(property => property.name), ['active']);
    assert.deepEqual(manifest.webTypes._package.contributions.html.elements[0].attributes[0].values,
        [{ type: 'small' }, { type: 'large' }]);
    assert.deepEqual(Object.keys(manifest.emmetCustomData._package.html.snippets), ['demo-card']);

    update(2, `/** Updated card. */ export class Card {
        @Attribute() size: "compact" | "expanded" = "compact";
        public ready: boolean = false;
        /** Closes card. */ close(reason: string): void {}
    }`);
    const second = manifest.customElements._package.modules[0].declarations[0];
    assert.deepEqual(second.attributes.map(attribute => attribute.name), ['size']);
    assert.deepEqual(second.members.map(member => member.name), ['ready', 'close']);
    assert.deepEqual(second.members[1].parameters, [{ name: 'reason', type: { text: 'string' } }]);
    assert.equal(second.members[1].return.type.text, 'void');
    assert.deepEqual(manifest.htmlCustomData._package.tags[0].attributes.map(attribute => attribute.name), ['size']);
    assert.deepEqual(manifest.htmlCustomData._package.tags[0].attributes[0].values,
        [{ name: 'compact' }, { name: 'expanded' }]);
    assert.deepEqual(manifest.webTypes._package.contributions.html.elements[0].js.properties.map(property => property.name), ['ready']);
    assert.deepEqual(manifest.webTypes._package.contributions.html.elements[0].attributes[0].values,
        [{ type: 'compact' }, { type: 'expanded' }]);
    assert.match(second.summary, /Updated card/);
});
