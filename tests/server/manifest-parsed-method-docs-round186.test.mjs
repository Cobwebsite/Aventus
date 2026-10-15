import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { Manifest }, { AventusWebComponentLogicalFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts', 'GenericServer.ts',
]);

test('parsed method documentation and signature are replaced across three manifest revisions', t => {
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
        return {
            declaration: manifest.customElements._package.modules[0].declarations[0],
            html: manifest.htmlCustomData._package.tags[0],
            web: manifest.webTypes._package.contributions.html.elements[0],
            snippets: manifest.emmetCustomData._package.html.snippets,
        };
    };

    const first = update(1, `/** Initial panel. */ export class Panel {
        /** Opens the panel.
         * @param target Target identifier.
         * @returns Opening status.
         */
        open(target: string = "main"): boolean { return true; }
    }`);
    const opening = first.declaration.members.find(item => item.name === 'open');
    assert.equal(opening.description, 'Opens the panel.');
    assert.deepEqual(opening.parameters, [{ name: 'target', type: { text: 'string' }, description: 'Target identifier.', default: '"main"' }]);
    assert.deepEqual(opening.return, { type: { text: 'boolean' }, description: 'Opening status.' });
    assert.match(first.html.description, /Opens the panel/);
    assert.match(first.web.description, /Opens the panel/);
    assert.deepEqual(Object.keys(first.snippets), ['demo-panel']);

    const second = update(2, `/** Revised panel. */ export class Panel {
        /** Closes the panel.
         * @param force Force closing.
         * @returns Closing result.
         */
        close(force?: boolean): string { return "closed"; }
    }`);
    assert.deepEqual(second.declaration.members.map(item => item.name), ['close']);
    const closing = second.declaration.members[0];
    assert.equal(closing.description, 'Closes the panel.');
    assert.deepEqual(closing.parameters, [{ name: 'force', type: { text: 'boolean' }, description: 'Force closing.', optional: true }]);
    assert.deepEqual(closing.return, { type: { text: 'string' }, description: 'Closing result.' });
    assert.match(second.html.description, /Closes the panel/);
    assert.doesNotMatch(second.html.description, /Opens the panel/);
    assert.match(second.web.description, /Closes the panel/);
    assert.doesNotMatch(second.web.description, /Opens the panel/);
    assert.deepEqual(Object.keys(second.snippets), ['demo-panel']);

    const third = update(3, '/** Empty panel. */ export class Panel {}');
    assert.equal(third.declaration.members, undefined);
    assert.doesNotMatch(third.html.description, /Closes the panel/);
    assert.doesNotMatch(third.web.description, /Closes the panel/);
    assert.deepEqual(Object.keys(third.snippets), ['demo-panel']);
});
