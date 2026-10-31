import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusPackageFile }, { GenericServer }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/ts/package/File.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4, _savePath: 'D:/round290', connection: { sendDiagnostics() {} } };

const uri = 'file:///D:/round290/Recovery.package.avt';
async function waitForDefinition(pkg, name) {
    for (let attempt = 0; attempt < 50 && !pkg.definition.includes(name); attempt++) {
        await new Promise(resolve => setTimeout(resolve, 10));
    }
}
const packageContent = (version, dependencies) => [
    `// Recovery@web:1.0.${version}`,
    '//#region js def //', `declare namespace Recovery { class Item${version} {} }`, '//#endregion js def //',
    '//#region js src //', JSON.stringify({ namespace: 'Recovery', available: [], existing: [] }), '//#endregion js src //',
    '//#region css def //', '{}', '//#endregion css def //',
    '//#region css //', '{}', '//#endregion css //',
    '//#region html //', '{}', '//#endregion html //',
    '//#region dependencies //', dependencies, '//#endregion dependencies //',
].join('\n');

test('package file accepts a corrected dependencies section after malformed JSON on the same instance', async () => {
    const rebuilds = [];
    const file = new InternalAventusFile(TextDocument.create(uri, 'typescript', 1, packageContent(1, '{bad json')));
    const build = {
        getNamespace: () => '',
        tsLanguageService: { addFile() {}, removeFile() {} },
        scssLanguageService: { addExternalDefinition() {}, removeExternalDefinition() {} },
        htmlLanguageService: { addExternalDefinition() {}, removeExternalDefinition() {} },
        externalPackageInformation: { rebuild: () => rebuilds.push(file.versionUser) },
        npmBuilder: { unregister() {} },
        build() {}, diagnostics: new Map(), reloadPage: false,
    };
    const pkg = new AventusPackageFile(file, build);
    assert.deepEqual(pkg.dependencies, {});

    await file.triggerContentChange(TextDocument.create(uri, 'typescript', 2, packageContent(2, '{"Second":"2.0.0"}')));
    await waitForDefinition(pkg, 'Item2');
    assert.match(pkg.definition, /Item2/);
    assert.equal(pkg.versionTxt, '1.0.2');
    assert.deepEqual(pkg.dependencies, { Second: '2.0.0' });
    assert.equal(rebuilds.length, 2);
    await file.triggerDelete();
});
