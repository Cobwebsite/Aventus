import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Build } = await loadServerModule('project/Build.ts');

function buildWithComponents() {
    const build = Object.create(Build.prototype);
    const localClass = { fullName: 'Demo.Card', fileUri: 'file:///local.wc.avt' };
    const localFile = {
        fileParsed: { classes: { 'Demo.Card': localClass } },
        getComponentName: () => 'Demo.Card',
    };
    const externalClass = { fullName: 'Vendor.Button', fileUri: 'file:///vendor.package.avt' };
    const externalFile = { uri: 'file:///vendor.package.avt' };
    build.buildConfig = { module: 'Demo' };
    build.htmlLanguageService = {
        getInternalDefinition: tag => tag === 'demo-card' ? localFile : undefined,
        getInternalTagUri: tag => tag === 'demo-card'
            ? { fullname: 'Demo.Card', uri: 'file:///local.wc.avt' } : undefined,
        getClassByTag: tag => tag === 'vendor-button' ? 'Vendor.Button' : undefined,
    };
    build.externalPackageInformation = {
        getExternalWebComponentDefinition: name => name === 'Vendor.Button' ? externalClass : undefined,
        getExternalWebComponentDefinitionFile: name => name === 'Vendor.Button' ? externalFile : undefined,
    };
    build.project = { getInternalWebComponentDefinition: () => undefined };
    return { build, localClass, localFile, externalClass, externalFile };
}

test('component lookup chooses local parsed class before package metadata', () => {
    const { build, localClass, localFile } = buildWithComponents();
    assert.equal(build.getLocalWebComponentDefinition('demo-card'), localClass);
    assert.deepEqual(build.getWebComponentDefinition('demo-card'), { class: localClass, isLocal: true });
    assert.equal(build.getWebComponentDefinitionFile('demo-card'), localFile);
    assert.deepEqual(build.getWebComponentTagDependency('demo-card'), {
        fullName: '$namespace$Card', uri: 'file:///local.wc.avt', isStrong: false,
    });
});

test('component lookup resolves external package and optional project version', () => {
    const { build, externalClass, externalFile } = buildWithComponents();
    assert.deepEqual(build.getWebComponentDefinition('vendor-button'), { class: externalClass, isLocal: false });
    assert.equal(build.getWebComponentDefinitionFile('vendor-button'), externalFile);
    assert.deepEqual(build.getWebComponentTagDependency('vendor-button'), {
        fullName: 'Vendor.Button', uri: '@external', isStrong: false,
    });
    const internal = { fullName: 'Vendor.Button', source: 'project' };
    const requests = [];
    build.project.getInternalWebComponentDefinition = (...args) => {
        requests.push(args);
        return internal;
    };
    assert.deepEqual(build.getWebComponentDefinition('vendor-button', true), { class: internal, isLocal: false });
    assert.equal(requests.length, 1);
    assert.equal(requests[0][1], 'vendor-button');
    assert.equal(build.getWebComponentDefinition('unknown'), undefined);
    assert.equal(build.getWebComponentDefinitionFile('unknown'), undefined);
    assert.equal(build.getWebComponentTagDependency('unknown'), null);
});

test('slot lookup merges external inheritance and keeps child documentation', () => {
    const { build } = buildWithComponents();
    const parent = {
        fullName: 'Vendor.Parent', fileUri: 'file:///vendor.package.avt',
        decorators: [], parentClass: null,
        documentation: { documentationSlots: { shared: 'Parent shared', footer: 'Parent footer' } },
    };
    const child = {
        fullName: 'Vendor.Child', fileUri: 'file:///vendor.package.avt',
        decorators: [], parentClass: parent,
        documentation: { documentationSlots: { shared: 'Child shared', header: 'Child header' } },
    };
    build.tsFiles = {};
    build.externalPackageInformation.getByFullName = name => ({
        content: { slots: name === 'Vendor.Child'
            ? { shared: {}, header: {} }
            : { shared: {}, footer: {} } },
    });
    assert.deepEqual(build.getSlotsInfo(child), {
        shared: { local: true, doc: 'Child shared' },
        header: { local: true, doc: 'Child header' },
        footer: { local: false, doc: 'Parent footer' },
    });
});

test('OverrideView stops inherited slots while preserving own slots', () => {
    const { build } = buildWithComponents();
    const parent = {
        fullName: 'Vendor.Parent', fileUri: 'file:///vendor.package.avt',
        decorators: [], parentClass: null,
        documentation: { documentationSlots: { inherited: 'Inherited' } },
    };
    const child = {
        fullName: 'Vendor.Child', fileUri: 'file:///vendor.package.avt',
        decorators: [{ name: 'OverrideView', arguments: [] }], parentClass: parent,
        documentation: { documentationSlots: { own: 'Own' } },
    };
    build.tsFiles = {};
    build.externalPackageInformation.getByFullName = name => ({
        content: { slots: name === 'Vendor.Child' ? { own: {} } : { inherited: {} } },
    });
    assert.deepEqual(build.getSlotsInfo(child), { own: { local: true, doc: 'Own' } });
});
