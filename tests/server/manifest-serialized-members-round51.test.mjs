import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Manifest }, { SettingsManager }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'manifest/Manifest.ts', 'settings/Settings.ts', 'language-services/ts/component/File.ts',
]);

function createManifest() {
    return new Manifest({}, {
        buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
        project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
        externalPackageInformation: { getByUri: () => undefined },
    });
}

function registerCard(manifest, description, mode) {
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._file = { uri: 'file:///project/Card.wcl.avt' };
    file.fileParsed = { classes: {} };
    file._componentClassName = 'Card';
    file._compileResult = [{ classScript: 'Demo.Card', tagName: 'demo-card' }];
    const node = ts.createSourceFile('card.ts', 'class Card { open(force?: boolean): string { return "ok"; } }', ts.ScriptTarget.Latest, true).statements[0].members[0];
    const info = {
        fullName: 'Demo.Card',
        class: { name: 'Card', documentation: { definitions: [description] }, extends: [], isAbstract: false },
        attributes: [{ name: 'mode', local: true, type: { kind: 'literal', value: `"${mode}"`, isArray: false }, documentation: { definitions: ['Display mode'] } }],
        props: [{ name: 'active', local: true, type: { kind: 'type', value: 'boolean', genericValue: [], isArray: false }, documentation: { definitions: ['Active state'] } }],
        propsStatic: [],
        methods: [{ name: 'open', local: true, node, documentation: { definitions: ['Opens card'], documentationParameters: { force: 'Force opening' }, documentationReturn: 'Result' } }],
        methodsStatic: [],
        cssProperties: [{ name: '--card-color', local: true, type: '<color>', defaultValue: 'red', documentation: 'Card color' }],
        slots: { body: { local: true, doc: 'Card body' } },
    };
    manifest.customElements.register(file, info);
    manifest.htmlCustomData.register(file, info);
    manifest.emmetCustomData.register(file, info);
    manifest.webTypes.register(file, info);
}

function readOutputs(root) {
    const read = (name) => JSON.parse(readFileSync(join(root, name), 'utf8'));
    return {
        custom: read('custom-elements.json'),
        html: read('vscode.html-custom-data.json'),
        web: read('web-types.json'),
        emmet: read(join('emmet', 'snippets.json')),
    };
}

test('serialized manifest members, attributes and slots remain consistent across four output formats', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-manifest-members-'));
    const previous = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const manifest = createManifest();
        registerCard(manifest, 'First card documentation', 'small');
        await manifest.write(root);
        const { custom, html, web, emmet } = readOutputs(root);
        const declaration = custom.modules[0].declarations[0];
        const tag = html.tags[0];
        const element = web.contributions.html.elements[0];

        assert.equal(custom.schemaVersion, '1.0.0');
        assert.equal(html.version, 1.1);
        assert.equal(web['description-markup'], 'markdown');
        assert.equal(declaration.tagName, tag.name);
        assert.equal(tag.name, element.name);
        assert.equal(emmet.html.snippets[tag.name], '<demo-card>${1}</demo-card>');
        assert.deepEqual(declaration.attributes.map(attribute => attribute.name), ['mode']);
        assert.deepEqual(tag.attributes[0].values, [{ name: 'small' }]);
        assert.deepEqual(element.attributes[0].values, [{ type: 'small' }]);
        assert.equal(declaration.members.find(member => member.name === 'active').type.text, 'boolean');
        assert.equal(element.js.properties.find(property => property.name === 'active').type, 'boolean');
        assert.deepEqual(declaration.members.find(member => member.name === 'open').parameters, [
            { name: 'force', type: { text: 'boolean' }, description: 'Force opening', optional: true },
        ]);
        assert.equal(declaration.members.find(member => member.name === 'open').return.description, 'Result');
        assert.deepEqual(declaration.cssProperties.map(property => property.name), ['--card-color']);
        assert.deepEqual(declaration.slots, [{ name: 'body' }]);
        assert.deepEqual(element.slots, [{ name: 'body', description: 'Card body' }]);
        assert.match(tag.description, /First card documentation/);
        assert.match(element.description, /First card documentation/);
    } finally {
        SettingsManager.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});

test('fresh manifest rewrite replaces serialized descriptions and attribute values in every format', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-manifest-rewrite-'));
    const previous = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const first = createManifest();
        registerCard(first, 'First card documentation', 'small');
        await first.write(root);
        const second = createManifest();
        registerCard(second, 'Updated card documentation', 'large');
        await second.write(root);
        const { custom, html, web, emmet } = readOutputs(root);
        assert.equal(custom.modules.length, 1);
        assert.equal(html.tags.length, 1);
        assert.equal(web.contributions.html.elements.length, 1);
        assert.match(custom.modules[0].declarations[0].summary, /Updated card documentation/);
        assert.match(html.tags[0].description, /Updated card documentation/);
        assert.match(web.contributions.html.elements[0].description, /Updated card documentation/);
        assert.deepEqual(html.tags[0].attributes[0].values, [{ name: 'large' }]);
        assert.deepEqual(web.contributions.html.elements[0].attributes[0].values, [{ type: 'large' }]);
        assert.deepEqual(Object.keys(emmet.html.snippets), ['demo-card']);
        for (const name of ['custom-elements.json', 'vscode.html-custom-data.json', 'web-types.json']) {
            assert.doesNotMatch(readFileSync(join(root, name), 'utf8'), /First card documentation|small/);
        }
    } finally {
        SettingsManager.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
