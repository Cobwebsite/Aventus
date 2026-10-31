import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Manifest }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts',
]);

test('registration sorts public local and inherited members and excludes private and protected ones', () => {
    const parentUri = 'file:///project/Base.wcl.avt';
    const childUri = 'file:///project/Card.wcl.avt';
    const property = (name, decorators = [], visibility = {}) => ({
        name, decorators, type: { kind: 'type', value: 'string', genericValue: [], isArray: false },
        ...visibility,
    });
    const method = (name, visibility = {}) => ({ name, ...visibility });
    const parent = {
        name: 'Base', fullName: 'Base', fileUri: parentUri, parentClass: null,
        properties: {
            zInherited: property('zInherited'),
            inheritedAttribute: property('inheritedAttribute', [{ name: 'Attribute', arguments: [] }]),
            hidden: property('hidden', [], { isPrivate: true }),
        },
        propertiesStatic: { inheritedStatic: property('inheritedStatic') },
        methods: { inheritedMethod: method('inheritedMethod'), hiddenMethod: method('hiddenMethod', { isProtected: true }) },
        methodsStatic: {}, decorators: [],
    };
    const child = {
        name: 'Card', fullName: 'Card', fileUri: childUri, parentClass: parent,
        properties: {
            ownProperty: property('ownProperty'),
            ownAttribute: property('ownAttribute', [{ name: 'Property', arguments: [] }]),
            concealed: property('concealed', [], { isProtected: true }),
        },
        propertiesStatic: { ownStatic: property('ownStatic') },
        methods: { ownMethod: method('ownMethod') },
        methodsStatic: { ownStaticMethod: method('ownStaticMethod') }, decorators: [],
    };
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri: childUri };
    file._componentClassName = 'Card';
    file._compileResult = [{ classScript: 'Demo.Card', tagName: 'demo-card' }];
    file.fileParsed = { classes: { Card: child } };
    const build = {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
        tsFiles: { [childUri]: file }, noNamespaceUri: {}, scssFiles: {}, htmlFiles: {},
        externalPackageInformation: { getByUri: () => undefined },
    };
    file._build = build;
    const manifest = new Manifest({}, build);
    const infos = [];
    for (const output of [manifest.customElements, manifest.htmlCustomData, manifest.emmetCustomData, manifest.webTypes]) {
        output.register = (_file, info) => infos.push(info);
    }

    manifest.register(file);
    assert.equal(infos.length, 4);
    assert.ok(infos.every(info => info === infos[0]));
    const info = infos[0];
    const entries = field => info[field].map(value => [value.name, value.local]);
    assert.deepEqual(entries('attributes'), [['inheritedAttribute', false], ['ownAttribute', true]]);
    assert.deepEqual(entries('props'), [['ownProperty', true], ['zInherited', false]]);
    assert.deepEqual(entries('propsStatic'), [['inheritedStatic', false], ['ownStatic', true]]);
    assert.deepEqual(entries('methods'), [['inheritedMethod', false], ['ownMethod', true]]);
    assert.deepEqual(entries('methodsStatic'), [['ownStaticMethod', true]]);
});
