import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Manifest }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts',
]);

test('component view blocks and OverrideView control which inherited slots enter manifests', () => {
    const parentUri = 'file:///project/Base.wcl.avt';
    const childUri = 'file:///project/Card.wcl.avt';
    const parent = {
        name: 'Base', fullName: 'Base', fileUri: parentUri, parentClass: null,
        properties: {}, propertiesStatic: {}, methods: {}, methodsStatic: {}, decorators: [],
        documentation: { documentationSlots: { header: 'Inherited header', footer: 'Inherited footer' } },
    };
    const child = {
        name: 'Card', fullName: 'Card', fileUri: childUri, parentClass: parent,
        properties: {}, propertiesStatic: {}, methods: {}, methodsStatic: {}, decorators: [],
        documentation: { documentationSlots: { body: 'Own body' } },
    };
    const makeFile = (uri, name) => {
        const file = Object.create(AventusWebComponentLogicalFile.prototype);
        file._file = { uri };
        file._componentClassName = name;
        file._compileResult = [{ classScript: `Demo.${name}`, tagName: `demo-${name.toLowerCase()}` }];
        file.fileParsed = { classes: { [name]: name === 'Card' ? child : parent } };
        return file;
    };
    const baseFile = makeFile(parentUri, 'Base');
    const cardFile = makeFile(childUri, 'Card');
    const build = {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
        tsFiles: { [parentUri]: baseFile, [childUri]: cardFile }, noNamespaceUri: {}, scssFiles: {},
        htmlFiles: {
            'file:///project/Base.wcv.avt': { fileParsed: { slotsInfo: { header: {}, footer: {} }, blocksInfo: {} } },
            'file:///project/Card.wcv.avt': { fileParsed: { slotsInfo: { body: {} }, blocksInfo: { header: {} } } },
        },
        externalPackageInformation: { getByUri: () => undefined },
    };
    baseFile._build = build;
    cardFile._build = build;
    const manifest = new Manifest({}, build);
    const infos = [];
    for (const output of [manifest.customElements, manifest.htmlCustomData, manifest.emmetCustomData, manifest.webTypes]) {
        output.register = (_file, info) => infos.push(info);
    }

    manifest.register(cardFile);
    assert.equal(infos.length, 4);
    assert.deepEqual(Object.keys(infos[0].slots), ['body', 'footer']);
    assert.deepEqual(infos[0].slots.body, { local: true, doc: 'Own body' });
    assert.deepEqual(infos[0].slots.footer, { local: false, doc: 'Inherited footer' });
    assert.ok(infos.every(info => info === infos[0]));

    child.decorators = [{ name: 'OverrideView', arguments: [] }];
    infos.length = 0;
    manifest.register(cardFile);
    assert.equal(infos.length, 4);
    assert.deepEqual(infos[0].slots, { body: { local: true, doc: 'Own body' } });
});
