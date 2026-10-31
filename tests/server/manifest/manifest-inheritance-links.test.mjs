import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Manifest }, { AventusWebComponentLogicalFile }, { BaseInfo }, { ClassInfo }] = await loadServerModules([
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts',
    'language-services/ts/parser/BaseInfo.ts', 'language-services/ts/parser/ClassInfo.ts',
]);

test('Custom Elements links local and package parents for superclass and overridden members', t => {
    const previousLookup = BaseInfo.getInfoByFullName;
    t.after(() => { BaseInfo.getInfoByFullName = previousLookup; });

    const parent = Object.create(ClassInfo.prototype);
    parent.name = 'BaseCard';
    parent.document = { uri: 'file:///project/BaseCard.wcl.avt' };
    BaseInfo.getInfoByFullName = () => parent;

    const build = {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
        externalPackageInformation: { getByUri: () => ({ npmUri: '@demo/components' }) },
    };
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri: 'file:///project/Card.wcl.avt' };
    file.fileParsed = { classes: {} };
    file._componentClassName = 'Card';
    file._compileResult = [{ classScript: 'Demo.Card', tagName: 'demo-card' }];
    const method = ts.createSourceFile('card.ts', 'class Card { open(): void {} }', ts.ScriptTarget.Latest, true)
        .statements[0].members[0];
    const info = {
        fullName: 'Demo.Card',
        class: {
            name: 'Card', extends: ['BaseCard'], isAbstract: false,
            getFieldParentClass: () => parent,
            getMethodParentClass: () => parent,
        },
        attributes: [{ name: 'size', local: true, isOverride: true,
            type: { kind: 'type', value: 'string', genericValue: [], isArray: false } }],
        props: [], propsStatic: [],
        methods: [{ name: 'open', local: true, isOverride: true, node: method }],
        methodsStatic: [], cssProperties: [], slots: {},
    };
    const declaration = () => {
        const manifest = new Manifest({}, build);
        manifest.customElements.register(file, info);
        return manifest.customElements._package.modules[0].declarations[0];
    };

    let result = declaration();
    assert.deepEqual(result.superclass, { name: 'BaseCard', module: '__src/BaseCard.wcl.js' });
    assert.deepEqual(result.attributes[0].inheritedFrom, result.superclass);
    assert.deepEqual(result.members[0].inheritedFrom, result.superclass);

    parent.document.uri = 'file:///project/BaseCard.package.avt';
    result = declaration();
    assert.deepEqual(result.superclass, { name: 'BaseCard', package: '@demo/components' });
    assert.deepEqual(result.attributes[0].inheritedFrom, result.superclass);
    assert.deepEqual(result.members[0].inheritedFrom, result.superclass);
});
