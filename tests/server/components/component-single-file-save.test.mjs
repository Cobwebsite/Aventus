import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ AventusWebComponentSingleFile }, { InternalAventusFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/component/SingleFile.ts',
    'files/AventusFile.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('saving a single-file component saves style and view before logic with build temporarily disabled', async () => {
    const uri = 'file:///D:/test/component-single-save-round287.wc.avt';
    const source = '<script>export class Card {}</script><template><p>Card</p></template><style>p{color:red}</style>';
    const file = new InternalAventusFile(TextDocument.create(uri, 'Aventus WebComponent', 1, source));
    const events = [];
    let disabled = false;
    const build = {
        tsFiles: {}, wcFiles: {}, getNamespace: () => '', getComponentPrefix: () => 'demo',
        getNamespaceForUri: () => '', addNamespace() {},
        npmBuilder: { unregister() {} }, module: 'Demo', namespaces: [], isCoreBuild: false,
        hasNpmOutput: false, hasStories: false, buildConfig: { componentPrefix: 'demo' },
        getNpmReplacementName: () => '', tsLanguageService: { addFile() {}, doValidation: () => [] },
        disableBuild() { assert.equal(disabled, false); disabled = true; events.push('disable'); },
        enableBuild() { assert.equal(disabled, true); disabled = false; events.push('enable'); },
    };
    const single = new AventusWebComponentSingleFile(file, build);
    for (const [region, name] of [['regionStyle', 'style'], ['regionView', 'view'], ['regionLogic', 'logic']]) {
        single[region].file = { file: { triggerSave: async () => {
            assert.equal(disabled, name !== 'logic');
            events.push(name);
        } } };
    }
    await single.onSave();
    assert.deepEqual(events, ['disable', 'style', 'view', 'enable', 'logic']);
    assert.equal(disabled, false);
    await file.triggerDelete();
});
