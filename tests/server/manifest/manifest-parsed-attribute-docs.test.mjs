import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [, { ParserTs }, { Manifest }, { AventusWebComponentLogicalFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts', 'GenericServer.ts',
]);

test('parsed attribute defaults and documentation are refreshed without stale manifest entries', t => {
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
            declaration: manifest.customElements._package.modules[0].declarations[0],
            html: manifest.htmlCustomData._package.tags[0],
            web: manifest.webTypes._package.contributions.html.elements[0],
            snippets: manifest.emmetCustomData._package.html.snippets,
        };
    };

    const first = update(1, `/** Initial badge. */ export class Badge {
        /** Initial display mode. */ @Attribute() mode: "small" | "large" = "small";
    }`);
    assert.deepEqual(first.declaration.attributes.map(item => item.name), ['mode']);
    assert.equal(first.declaration.attributes[0].default, '"small"');
    assert.equal(first.declaration.attributes[0].description, 'Initial display mode.');
    assert.deepEqual(first.html.attributes[0].values, [{ name: 'small' }, { name: 'large' }]);
    assert.match(first.html.attributes[0].description, /Initial display mode/);
    assert.deepEqual(first.web.attributes[0].values, [{ type: 'small' }, { type: 'large' }]);
    assert.match(first.web.attributes[0].description, /Initial display mode/);
    assert.deepEqual(Object.keys(first.snippets), ['demo-badge']);

    const second = update(2, `/** Revised badge. */ export class Badge {
        /** Current density. */ @Attribute() density: "compact" | "roomy" = "roomy";
    }`);
    assert.deepEqual(second.declaration.attributes.map(item => item.name), ['density']);
    assert.equal(second.declaration.attributes[0].default, '"roomy"');
    assert.equal(second.declaration.attributes[0].description, 'Current density.');
    assert.deepEqual(second.html.attributes.map(item => item.name), ['density']);
    assert.deepEqual(second.html.attributes[0].values, [{ name: 'compact' }, { name: 'roomy' }]);
    assert.match(second.html.attributes[0].description, /Current density/);
    assert.doesNotMatch(second.html.description, /Initial display mode/);
    assert.deepEqual(second.web.attributes.map(item => item.name), ['density']);
    assert.deepEqual(second.web.attributes[0].values, [{ type: 'compact' }, { type: 'roomy' }]);
    assert.match(second.web.attributes[0].description, /Current density/);
    assert.doesNotMatch(second.web.description, /Initial display mode/);
    assert.deepEqual(Object.keys(second.snippets), ['demo-badge']);

    const third = update(3, '/** Plain badge. */ export class Badge {}');
    assert.equal(third.declaration.attributes, undefined);
    assert.equal(third.html.attributes, undefined);
    assert.equal(third.web.attributes, undefined);
    assert.deepEqual(Object.keys(third.snippets), ['demo-badge']);
});
