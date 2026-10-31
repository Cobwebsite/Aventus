import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { Manifest }, { AventusWebComponentLogicalFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts', 'GenericServer.ts',
]);

test('parsed component manifest excludes private members and refreshes public static members', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/Panel.wcl.avt';
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
    file._componentClassName = 'Panel';
    file._compileResult = [{ classScript: 'Demo.Panel', tagName: 'demo-panel' }];
    build.tsFiles[uri] = file;
    const manifest = new Manifest({}, build);
    const update = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        manifest.register(file);
        return manifest.customElements._package.modules[0].declarations[0];
    };

    const first = update(1, `export class Panel {
        public static kind: string = 'panel';
        public static make(): string { return 'panel'; }
        private secret: number = 1;
        protected guarded(): void {}
        public visible: boolean = true;
    }`);
    assert.deepEqual(first.members.map(member => member.name), ['visible', 'kind', 'make']);
    assert.deepEqual(manifest.webTypes._package.contributions.html.elements[0].js.properties.map(property => property.name), ['visible']);

    const second = update(2, `export class Panel {
        public static version: number = 2;
        public static create(): number { return 2; }
        private hidden: string = '';
        public ready: boolean = false;
    }`);
    assert.deepEqual(second.members.map(member => member.name), ['ready', 'version', 'create']);
    assert.deepEqual(manifest.webTypes._package.contributions.html.elements[0].js.properties.map(property => property.name), ['ready']);
});

test('parsed Property and Attribute decorators appear as HTML attributes and JavaScript properties after edit', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/Badge.wcl.avt';
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
    file._componentClassName = 'Badge';
    file._compileResult = [{ classScript: 'Demo.Badge', tagName: 'demo-badge' }];
    build.tsFiles[uri] = file;
    const manifest = new Manifest({}, build);
    const update = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        manifest.register(file);
        return {
            custom: manifest.customElements._package.modules[0].declarations[0],
            html: manifest.htmlCustomData._package.tags[0],
            web: manifest.webTypes._package.contributions.html.elements[0],
            snippets: manifest.emmetCustomData._package.html.snippets,
        };
    };

    const first = update(1, `export class Badge {
        @Attribute() public tone: 'info' | 'error' = 'info';
        @Property() public payload: string = '';
    }`);
    assert.deepEqual(first.custom.attributes.map(attribute => attribute.name), ['payload', 'tone']);
    assert.deepEqual(first.custom.members.map(member => member.name), ['payload', 'tone']);
    assert.deepEqual(first.html.attributes.map(attribute => attribute.name), ['payload', 'tone']);
    assert.deepEqual(first.web.attributes.map(attribute => attribute.name), ['payload', 'tone']);
    assert.deepEqual(first.web.js.properties.map(property => property.name), ['payload', 'tone']);
    assert.deepEqual(Object.keys(first.snippets), ['demo-badge']);

    const second = update(2, `export class Badge {
        @Attribute() public severity: 'low' | 'high' = 'low';
        @Property() public content: number = 1;
    }`);
    assert.deepEqual(second.custom.attributes.map(attribute => attribute.name), ['content', 'severity']);
    assert.deepEqual(second.custom.members.map(member => member.name), ['content', 'severity']);
    assert.deepEqual(second.html.attributes.map(attribute => attribute.name), ['content', 'severity']);
    assert.deepEqual(second.web.attributes.map(attribute => attribute.name), ['content', 'severity']);
    assert.deepEqual(second.web.js.properties.map(property => property.name), ['content', 'severity']);
    assert.deepEqual(Object.keys(second.snippets), ['demo-badge']);
});
