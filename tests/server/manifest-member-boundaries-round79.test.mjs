import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Manifest }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'manifest/Manifest.ts', 'language-services/ts/component/File.ts',
]);

function fixture() {
    const manifest = new Manifest({}, {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
        externalPackageInformation: { getByUri: () => undefined },
    });
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri: 'file:///project/Card.wcl.avt' };
    file.fileParsed = { classes: {} };
    file._componentClassName = 'Card';
    file._compileResult = [{ classScript: 'Demo.Card', tagName: 'demo-card' }];
    const node = ts.createSourceFile('card.ts', 'class Card { run(label: string = "now", count?: number): void {} }', ts.ScriptTarget.Latest, true).statements[0].members[0];
    const textType = { kind: 'type', value: 'string', genericValue: [], isArray: false };
    const info = {
        fullName: 'Demo.Card',
        class: { name: 'Card', documentation: { definitions: ['A card'] }, extends: [], isAbstract: true },
        attributes: [
            { name: 'own', local: true, type: textType, defaultValue: 'ready' },
            { name: 'base', local: false, type: textType },
        ],
        props: [
            { name: 'secret', local: true, isProtected: true, type: textType, defaultValue: 'hidden' },
            { name: 'inherited', local: false, type: textType },
        ],
        propsStatic: [{ name: 'cache', local: true, isPrivate: true, type: textType }],
        methods: [
            { name: 'run', local: true, node, documentation: { definitions: ['Runs'], documentationParameters: { label: 'Label' }, documentationReturn: 'Nothing' } },
            { name: 'fromBase', local: false, node },
        ],
        methodsStatic: [],
        cssProperties: [{ name: '--own', local: true }, { name: '--base', local: false }],
        slots: { own: { local: true, doc: 'Own slot' }, base: { local: false, doc: 'Base slot' } },
    };
    return { manifest, file, info };
}

test('Custom Elements emits only local members and preserves visibility, defaults and method parameters', () => {
    const { manifest, file, info } = fixture();
    manifest.customElements.register(file, info);
    const declaration = manifest.customElements._package.modules[0].declarations[0];
    assert.deepEqual(declaration.attributes.map(({ name, default: value }) => [name, value]), [['own', 'ready']]);
    assert.deepEqual(declaration.members.map(({ name, privacy, static: isStatic, default: value }) => [name, privacy, isStatic, value]), [
        ['own', 'public', false, 'ready'], ['secret', 'protected', false, 'hidden'], ['cache', 'private', true, undefined], ['run', 'public', false, undefined],
    ]);
    assert.deepEqual(declaration.members[3].parameters, [
        { name: 'label', type: { text: 'string' }, description: 'Label', default: '"now"' },
        { name: 'count', type: { text: 'number' }, optional: true },
    ]);
    assert.deepEqual(declaration.cssProperties.map(({ name }) => name), ['--own']);
    assert.deepEqual(declaration.slots.map(({ name }) => name), ['own']);
});

test('HTML and Web Types retain inherited attribute metadata while slots stay local', () => {
    const { manifest, file, info } = fixture();
    manifest.htmlCustomData.register(file, info);
    manifest.webTypes.register(file, info);
    const html = manifest.htmlCustomData._package.tags[0];
    const web = manifest.webTypes._package.contributions.html.elements[0];
    assert.deepEqual(html.attributes.map(({ name }) => name), ['own', 'base']);
    assert.deepEqual(web.attributes.map(({ name }) => name), ['own', 'base']);
    assert.deepEqual(web.js.properties.map(({ name }) => name), ['base', 'inherited', 'own', 'secret']);
    assert.deepEqual(web.slots.map(({ name }) => name), ['own']);
    assert.equal(web.abstract, true);
});
