import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [manifestModule, componentModule] = await loadServerModules([
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts',
]);
const { Manifest } = manifestModule;
const { AventusWebComponentLogicalFile } = componentModule;

function component(uri, className, parsed) {
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri };
    file._componentClassName = className;
    file.fileParsed = parsed;
    return file;
}

test('manifest registration gathers public local and inherited members, slots and CSS properties', () => {
    const childUri = 'file:///card.wcl.avt';
    const parentUri = 'file:///base.wcl.avt';
    const parent = {
        name: 'Base', fullName: 'Base', fileUri: parentUri, parentClass: null,
        properties: { inherited: { name: 'inherited', decorators: [] } },
        propertiesStatic: {}, methods: {}, methodsStatic: {}, decorators: [],
        documentation: { documentationSlots: { header: 'Parent header' } },
    };
    const child = {
        name: 'Card', fullName: 'Card', fileUri: childUri, parentClass: parent,
        properties: {
            zeta: { name: 'zeta', decorators: [] },
            alpha: { name: 'alpha', decorators: [] },
            secret: { name: 'secret', isPrivate: true, decorators: [] },
            size: { name: 'size', decorators: [{ name: 'Attribute', arguments: [] }] },
        },
        propertiesStatic: {}, methods: { render: { name: 'render' } }, methodsStatic: {},
        decorators: [], documentation: { documentationSlots: { footer: 'Child footer' } },
    };
    const own = component(childUri, 'Card', { classes: { Card: child } });
    const inherited = component(parentUri, 'Base', { classes: { Base: parent } });
    const build = {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///aventus.conf.avt' }) },
        tsFiles: { [childUri]: own, [parentUri]: inherited },
        scssFiles: {
            'file:///card.wcs.avt': { customProperties: [{ name: '--zeta' }] },
            'file:///base.wcs.avt': { customProperties: [{ name: '--alpha' }] },
        },
        htmlFiles: {
            'file:///card.wcv.avt': { fileParsed: { slotsInfo: { footer: {} }, blocksInfo: {} } },
            'file:///base.wcv.avt': { fileParsed: { slotsInfo: { header: {} }, blocksInfo: {} } },
        },
        noNamespaceUri: {},
    };
    own._build = build;
    inherited._build = build;
    const manifest = new Manifest({}, build);
    const calls = [];
    for (const generator of [manifest.customElements, manifest.htmlCustomData, manifest.emmetCustomData, manifest.webTypes]) {
        generator.register = (_file, info) => calls.push(info);
    }
    manifest.register(own);
    assert.equal(calls.length, 4);
    assert.ok(calls.every(info => info === calls[0]));
    const info = calls[0];
    assert.equal(info.fullName, 'Demo.Card');
    assert.deepEqual(info.props.map(item => [item.name, item.local]), [
        ['alpha', true], ['inherited', false], ['zeta', true],
    ]);
    assert.deepEqual(info.attributes.map(item => [item.name, item.local]), [['size', true]]);
    assert.deepEqual(info.methods.map(item => item.name), ['render']);
    assert.deepEqual(info.cssProperties.map(item => [item.name, item.local]), [
        ['--alpha', false], ['--zeta', true],
    ]);
    assert.deepEqual(Object.keys(info.slots), ['footer', 'header']);
    assert.equal(info.slots.footer.local, true);
    assert.equal(info.slots.header.local, false);
});

test('manifest ignores a missing component class and respects a namespace opt-out', () => {
    const uri = 'file:///simple.wcl.avt';
    const file = component(uri, 'Missing', { classes: {} });
    const build = {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///aventus.conf.avt' }) },
        tsFiles: { [uri]: file }, htmlFiles: {}, scssFiles: {},
        noNamespaceUri: { [uri]: true },
    };
    file._build = build;
    const manifest = new Manifest({}, build);
    const calls = [];
    for (const generator of [manifest.customElements, manifest.htmlCustomData, manifest.emmetCustomData, manifest.webTypes]) {
        generator.register = (_file, info) => calls.push(info);
    }
    manifest.register(file);
    assert.deepEqual(calls, []);
    file.fileParsed.classes.Missing = {
        name: 'Missing', fullName: 'Nested.Missing', fileUri: uri, parentClass: null,
        properties: {}, propertiesStatic: {}, methods: {}, methodsStatic: {}, decorators: [],
    };
    manifest.register(file);
    assert.equal(calls.length, 4);
    assert.equal(calls[0].fullName, 'Nested.Missing');
});
