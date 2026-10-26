import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { Manifest }, { AventusWebComponentLogicalFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts', 'GenericServer.ts',
]);

test('parsed accessors refresh their declarations and documentation across revisions', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/Accessor.wcl.avt';
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
    file._componentClassName = 'Accessor';
    file._compileResult = [{ classScript: 'Demo.Accessor', tagName: 'demo-accessor' }];
    build.tsFiles[uri] = file;
    const manifest = new Manifest({}, build);
    const update = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        manifest.register(file);
        return {
            declaration: manifest.customElements._package.modules[0].declarations[0],
            html: manifest.htmlCustomData._package.tags[0],
            web: manifest.webTypes._package.contributions.html.elements[0],
            snippets: manifest.emmetCustomData._package.html.snippets,
        };
    };

    const first = update(1, `/** First accessor. */ export class Accessor {
        private _value = 1;
        /** Read the count. */ get count(): number { return this._value; }
    }`);
    assert.deepEqual(first.declaration.members.filter(member => member.privacy === 'public').map(member => [member.name, member.type.text]), [['count', 'number']]);
    assert.equal(first.declaration.members.find(member => member.name === 'count').description, 'Read the count.');
    assert.match(first.html.description, /Read the count/);
    assert.match(first.web.description, /Read the count/);
    assert.deepEqual(Object.keys(first.snippets), ['demo-accessor']);

    const second = update(2, `/** Revised accessor. */ export class Accessor {
        private _value = '';
        /** Read the label. */ get label(): string { return this._value; }
        /** Write the label. */ set label(value: string) { this._value = value; }
    }`);
    assert.deepEqual(second.declaration.members.filter(member => member.privacy === 'public').map(member => [member.name, member.type.text]), [['label', 'string']]);
    assert.equal(second.declaration.members.find(member => member.name === 'label').description, 'Read the label.');
    assert.match(second.html.description, /Read the label/);
    assert.doesNotMatch(second.html.description, /Read the count/);
    assert.match(second.web.description, /Read the label/);
    assert.doesNotMatch(second.web.description, /Read the count/);
    assert.deepEqual(Object.keys(second.snippets), ['demo-accessor']);

    const setterOnly = update(3, `export class Accessor {
        private _value = '';
        /** Write the label. */ set label(value: string) { this._value = value; }
    }`);
    assert.deepEqual(setterOnly.declaration.members.filter(member => member.privacy === 'public').map(member => [member.name, member.type.text]), [['label', 'string']]);
    assert.equal(setterOnly.declaration.members.find(member => member.name === 'label').description, 'Write the label.');

    const third = update(4, '/** Plain component. */ export class Accessor {}');
    assert.equal(third.declaration.members, undefined);
    assert.doesNotMatch(third.html.description, /Read the label|Read the count/);
    assert.doesNotMatch(third.web.description, /Read the label|Read the count/);
    assert.deepEqual(Object.keys(third.snippets), ['demo-accessor']);
});
