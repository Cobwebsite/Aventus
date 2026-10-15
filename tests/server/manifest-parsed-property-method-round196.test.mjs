import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { Manifest }, { AventusWebComponentLogicalFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts', 'GenericServer.ts',
]);

test('parsed property and method revisions replace Custom Elements members and cross-format documentation', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4 };
    const uri = 'file:///project/Counter.wcl.avt';
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
    file._componentClassName = 'Counter';
    file._compileResult = [{ classScript: 'Demo.Counter', tagName: 'demo-counter' }];
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

    const first = update(1, `/** Initial counter. */ export class Counter {
        /** Current count. */ count: number = 1;
        /** Increase the count. */ increase(step: number): number { return this.count + step; }
    }`);
    assert.deepEqual(first.declaration.members.map(member => [member.kind, member.name]), [['field', 'count'], ['method', 'increase']]);
    assert.equal(first.declaration.members[0].description, 'Current count.');
    assert.equal(first.declaration.members[1].description, 'Increase the count.');
    assert.match(first.html.description, /Increase the count/);
    assert.match(first.web.description, /Increase the count/);
    assert.deepEqual(Object.keys(first.snippets), ['demo-counter']);

    const second = update(2, `/** Revised counter. */ export class Counter {
        /** Counter label. */ label: string = "new";
        /** Reset the label. */ reset(): void { this.label = ""; }
    }`);
    assert.deepEqual(second.declaration.members.map(member => [member.kind, member.name]), [['field', 'label'], ['method', 'reset']]);
    assert.equal(second.declaration.members[0].description, 'Counter label.');
    assert.equal(second.declaration.members[1].description, 'Reset the label.');
    assert.match(second.html.description, /Reset the label/);
    assert.doesNotMatch(second.html.description, /Increase the count/);
    assert.match(second.web.description, /Reset the label/);
    assert.doesNotMatch(second.web.description, /Increase the count/);
    assert.deepEqual(Object.keys(second.snippets), ['demo-counter']);

    const third = update(3, '/** Plain counter. */ export class Counter {}');
    assert.equal(third.declaration.members, undefined);
    assert.doesNotMatch(third.html.description, /Reset the label/);
    assert.doesNotMatch(third.web.description, /Reset the label/);
    assert.deepEqual(Object.keys(third.snippets), ['demo-counter']);
});
