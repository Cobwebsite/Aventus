import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { Manifest }, { AventusWebComponentLogicalFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts', 'GenericServer.ts',
]);

test('parsed mixed attributes, fields and methods refresh together across component revisions', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/Mixed.wcl.avt';
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
    file._componentClassName = 'Mixed';
    file._compileResult = [{ classScript: 'Demo.Mixed', tagName: 'demo-mixed' }];
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

    const first = update(1, `/** First component. */ export class Mixed {
        /** Color choice. */ @Attribute() color: 'red' | 'blue' = 'red';
        /** Counter field. */ count: number = 1;
        /** Compute a label.
         * @param prefix Label prefix.
         * @returns Computed label.
         */
        static label(prefix: string): string { return prefix; }
    }`);
    assert.deepEqual(first.declaration.attributes.map(item => item.name), ['color']);
    assert.deepEqual(first.declaration.members.map(item => [item.kind, item.name, item.static]), [
        ['field', 'color', false], ['field', 'count', false], ['method', 'label', true],
    ]);
    assert.equal(first.declaration.members[1].description, 'Counter field.');
    assert.equal(first.declaration.members[2].description, 'Compute a label.');
    assert.deepEqual(first.declaration.members[2].parameters, [{ name: 'prefix', type: { text: 'string' }, description: 'Label prefix.' }]);
    assert.deepEqual(first.html.attributes[0].values, [{ name: 'red' }, { name: 'blue' }]);
    assert.deepEqual(first.web.attributes[0].values, [{ type: 'red' }, { type: 'blue' }]);
    assert.match(first.html.description, /Counter field/);
    assert.match(first.web.description, /Compute a label/);
    assert.deepEqual(Object.keys(first.snippets), ['demo-mixed']);

    const second = update(2, `/** Second component. */ export class Mixed {
        /** Size choice. */ @Attribute() size: 'small' | 'large' = 'large';
        /** Enabled field. */ enabled: boolean = true;
        /** Reset the component. */ reset(): void { this.enabled = false; }
    }`);
    assert.deepEqual(second.declaration.attributes.map(item => item.name), ['size']);
    assert.deepEqual(second.declaration.members.map(item => [item.kind, item.name, item.static]), [
        ['field', 'enabled', false], ['field', 'size', false], ['method', 'reset', false],
    ]);
    assert.deepEqual(second.html.attributes.map(item => item.name), ['size']);
    assert.deepEqual(second.web.attributes.map(item => item.name), ['size']);
    assert.deepEqual(second.html.attributes[0].values, [{ name: 'small' }, { name: 'large' }]);
    assert.deepEqual(second.web.attributes[0].values, [{ type: 'small' }, { type: 'large' }]);
    assert.match(second.html.description, /Reset the component/);
    assert.match(second.web.description, /Enabled field/);
    assert.doesNotMatch(second.html.description, /Counter field|Compute a label|Color choice/);
    assert.doesNotMatch(second.web.description, /Counter field|Compute a label|Color choice/);
    assert.deepEqual(Object.keys(second.snippets), ['demo-mixed']);
});
