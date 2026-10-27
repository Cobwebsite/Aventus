import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusWebComponentSingleFile }, { InternalAventusFile }, { GenericServer }] = await loadServerModules([
    'language-services/ts/component/SingleFile.ts', 'files/AventusFile.ts', 'GenericServer.ts',
]);

test('single-file template extraction across nested-template and corrected revisions', async t => {
    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 4 };
    t.after(() => { GenericServer.instance = previousServer; });
    const uri = 'file:///D:/test/component-nested-template-round230.wc.avt';
    const script = '<script>@TagName("demo-card") export class Card {}</script>';
    const source = view => `${script}<template>${view}</template><style>.card{color:red}</style>`;
    const plain = source('<div>Plain</div>');
    const nested = source('<div><template><b>Nested</b></template></div>');
    const repaired = source('<div>Repaired</div>');
    const build = {
        tsFiles: {}, wcFiles: {}, scssFiles: {}, htmlFiles: {}, i18nComponentsFiles: {},
        getNamespace: () => '', getComponentPrefix: () => 'demo', getNamespaceForUri: () => '', addNamespace() {},
        npmBuilder: { unregister() {} }, module: 'Demo', namespaces: [], isCoreBuild: false,
        hasNpmOutput: false, hasStories: false, buildConfig: { componentPrefix: 'demo' },
        getNpmReplacementName: () => '', tsLanguageService: { addFile() {}, doValidation: () => [] },
    };
    const file = new InternalAventusFile(TextDocument.create(uri, 'Aventus WebComponent', 1, plain));
    const single = new AventusWebComponentSingleFile(file, build);
    build.wcFiles[uri] = single;
    const children = [single.logic, single.view, single.style];
    for (const child of children) {
        child.file.onContentChangeCb[child.uuidEvents.onContentChange] = async () => {};
        child.file.validate = async () => [];
    }
    file.validate = async () => [];
    try {
        assert.equal(AventusWebComponentSingleFile.getRegion(file).htmlText, '<div>Plain</div>');
        assert.equal(single.view.file.contentUser, '<div>Plain</div>');

        await file.triggerContentChange(TextDocument.create(uri, 'Aventus WebComponent', 2, nested));
        assert.equal(single.view.file.contentUser, '<div><template><b>Nested</b></template></div>');
        assert.equal(AventusWebComponentSingleFile.getRegion(file).htmlText, '<div><template><b>Nested</b></template></div>');
        assert.equal(single.logic, children[0]);
        assert.equal(single.view, children[1]);
        assert.equal(single.style, children[2]);

        await file.triggerContentChange(TextDocument.create(uri, 'Aventus WebComponent', 3, repaired));
        assert.equal(single.view.file.contentUser, '<div>Repaired</div>');
        assert.equal(AventusWebComponentSingleFile.getRegion(file).htmlText, '<div>Repaired</div>');
        assert.doesNotMatch(single.view.file.contentUser, /Nested/);

        const neighboring = `${script}<template><div><template>Inner</template></div></template><template>Outside</template><style>.card{color:red}</style>`;
        await file.triggerContentChange(TextDocument.create(uri, 'Aventus WebComponent', 4, neighboring));
        assert.equal(single.view.file.contentUser, '<div><template>Inner</template></div>');
        assert.equal(AventusWebComponentSingleFile.getRegion(file).htmlText, single.view.file.contentUser);
    } finally {
        await file.triggerDelete();
    }
});
