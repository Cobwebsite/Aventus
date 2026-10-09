import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Manifest }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts',
]);

function fixture() {
    const build = {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
        externalPackageInformation: { getByUri: () => undefined },
    };
    const manifest = new Manifest({ srcBaseUrl: 'https://example.test/src' }, build);
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri: 'file:///project/Card.wcl.avt' };
    file.fileParsed = { classes: {} };
    file._componentClassName = 'Card';
    file._compileResult = [{ classScript: 'Demo.Card', tagName: 'demo-card' }];
    const method = ts.createSourceFile('card.ts', 'class Card { open(force?: boolean): string { return "ok"; } }', ts.ScriptTarget.Latest, true).statements[0].members[0];
    const info = {
        fullName: 'Demo.Card',
        class: { name: 'Card', documentation: { definitions: ['Card docs'] }, extends: [], isAbstract: false },
        attributes: [{ name: 'mode', local: true, type: { kind: 'literal', value: '"small"', isArray: false }, documentation: { definitions: ['Mode docs'] } }],
        props: [{ name: 'active', local: true, type: { kind: 'boolean', isArray: false }, documentation: { definitions: ['Active docs'] } }],
        propsStatic: [{ name: 'count', local: true, type: { kind: 'number', isArray: false } }],
        methods: [{ name: 'open', local: true, node: method, documentation: { definitions: ['Open docs'], documentationParameters: { force: 'Force open' }, documentationReturn: 'Result' } }],
        methodsStatic: [], cssProperties: [], slots: {},
    };
    return { manifest, file, info };
}

test('Custom Elements emits local instance and static fields with source metadata', () => {
    const { manifest, file, info } = fixture();
    manifest.customElements.register(file, info);
    const module = manifest.customElements._package.modules[0];
    const declaration = module.declarations[0];
    assert.equal(module.path, '__src/Card.wcl.js');
    assert.equal(declaration.source.href, 'https://example.test/src/__src/Card.wcl.js');
    assert.equal(declaration.summary, 'Card docs');
    assert.deepEqual(declaration.attributes.map(({ name, type }) => [name, type.text]), [['mode', '"small"']]);
    assert.deepEqual(declaration.members.map(({ name, kind, static: isStatic }) => [name, kind, isStatic]), [
        ['active', 'field', false], ['count', 'field', true],
    ]);
    assert.equal(module.exports[0].declaration.module, module.path);
});

test('Custom Elements currently omits a documented method from declaration members', () => {
    const { manifest, file, info } = fixture();
    manifest.customElements.register(file, info);
    const declaration = manifest.customElements._package.modules[0].declarations[0];
    assert.equal(info.methods[0].name, 'open');
    assert.equal(declaration.members.some(member => member.name === 'open'), false);
});

test('Web Types currently omits attributes while retaining JS properties', () => {
    const { manifest, file, info } = fixture();
    manifest.webTypes.register(file, info);
    const element = manifest.webTypes._package.contributions.html.elements[0];
    assert.equal(info.attributes[0].name, 'mode');
    assert.equal(element.attributes, undefined);
    assert.deepEqual(element.js.properties.map(({ name, type }) => [name, type]), [['active', 'boolean']]);
});
