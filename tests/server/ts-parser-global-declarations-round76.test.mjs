import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

let sequence = 0;
function parse(source) {
    const uri = `file:///D:/test/global-declarations-round76-${++sequence}.lib.avt`;
    const document = TextDocument.create(uri, 'typescript', 1, source);
    const file = { uri, versionInternal: 1, documentUser: document, documentInternal: document };
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false,
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
    };
    return ParserTs.parse(file, false, build);
}

test('TS parser indexes declarations inside global augmentation without adding a global namespace', () => {
    const model = parse('export {}; declare global { interface Window { appReady: boolean } namespace Demo { class Marker {} } }');
    assert.equal(model.internalObjects.Window.fullname, 'Window');
    assert.equal(model.classes.Window.fullName, 'Window');
    assert.equal(model.internalObjects.Marker.fullname, 'Demo.Marker');
    assert.equal(model.classes.Marker.fullName, 'Demo.Marker');
    assert.equal(model.getBaseInfoFullName('Demo.Marker'), model.classes.Marker);
    assert.deepEqual(model.errors, []);
});

test('TS parser indexes each declaration in a variable statement with its export flag and namespace', () => {
    const model = parse('namespace Demo { export const first = 1, second = 2; const hidden = 3; }');
    for (const name of ['first', 'second']) {
        assert.equal(model.internalObjects[name].fullname, `Demo.${name}`);
        assert.equal(model.internalObjects[name].isExported, true);
        assert.ok(model.variables[name]);
    }
    assert.equal(model.internalObjects.hidden.fullname, 'Demo.hidden');
    assert.equal(model.internalObjects.hidden.isExported, false);
    assert.deepEqual(model.errors, []);
});
