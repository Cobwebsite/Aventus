import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Manifest }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts',
]);

function fixture(tagName = 'demo-card') {
    const build = {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///aventus.conf.avt' }) },
        externalPackageInformation: { getByUri: () => undefined },
    };
    const manifest = new Manifest({}, build);
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri: 'file:///card.wcl.avt' };
    file.fileParsed = { classes: {} };
    file._componentClassName = 'Card';
    file._compileResult = [{ classScript: 'Demo.Card', tagName }];
    const info = {
        fullName: 'Demo.Card',
        class: { name: 'Card', documentation: { definitions: ['A card'] }, isAbstract: false, extends: [] },
        attributes: [{ name: 'size', local: true, type: { kind: 'union', nested: [
            { kind: 'literal', value: '"small"', isArray: false },
            { kind: 'literal', value: '"large"', isArray: false },
        ], isArray: false }, documentation: { definitions: ['Card size'] } }],
        props: [{ name: 'active', local: true, type: { kind: 'boolean', isArray: false }, documentation: { definitions: ['Is active'] } }],
        propsStatic: [], methods: [], methodsStatic: [],
        cssProperties: [{ name: '--accent', local: true, type: 'color', defaultValue: 'red', documentation: 'Accent color' }],
        slots: { header: { local: true, doc: 'Header content' } },
    };
    return { manifest, file, info };
}

test('manifest serializes union attribute values and CSS/slot metadata', () => {
    const { manifest, file, info } = fixture();
    manifest.htmlCustomData.register(file, info);
    manifest.customElements.register(file, info);
    const html = manifest.htmlCustomData._package.tags[0];
    const declaration = manifest.customElements._package.modules[0].declarations[0];
    assert.deepEqual(html.attributes[0].values, [{ name: 'small' }, { name: 'large' }]);
    assert.match(html.attributes[0].description, /Card size/);
    assert.equal(declaration.cssProperties[0].default, 'red');
    assert.equal(declaration.cssProperties[0].syntax, 'color');
    assert.equal(declaration.slots[0].name, 'header');
});

test('Web Types includes slot and JavaScript property documentation', () => {
    const { manifest, file, info } = fixture();
    manifest.webTypes.register(file, info);
    const element = manifest.webTypes._package.contributions.html.elements[0];
    assert.equal(element.attributes[0].name, 'size');
    assert.match(element.attributes[0].description, /Card size/);
    assert.deepEqual(element.attributes[0].values, [{ type: 'small' }, { type: 'large' }]);
    assert.equal(element.slots[0].description, 'Header content');
    assert.equal(element.js.properties[0].name, 'active');
    assert.equal(element.js.properties[0].description, 'Is active');
});

test('HTML custom data and Emmet skip compilation results without a tag', () => {
    const { manifest, file, info } = fixture('');
    manifest.htmlCustomData.register(file, info);
    manifest.emmetCustomData.register(file, info);
    assert.deepEqual(manifest.htmlCustomData._package.tags, []);
    assert.deepEqual(manifest.emmetCustomData._package.html.snippets, {});
});
