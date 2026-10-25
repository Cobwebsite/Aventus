import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Manifest }, { SettingsManager }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'manifest/Manifest.ts', 'settings/Settings.ts', 'language-services/ts/component/File.ts',
]);

test('registering a parsed component propagates decorated attributes, CSS variables and slots to serialized formats', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-manifest-register-output-'));
    const previousSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const uri = 'file:///project/Card.wcl.avt';
        const cls = {
            name: 'Card', fullName: 'Card', fileUri: uri, parentClass: null, extends: [], isAbstract: false,
            properties: {
                mode: {
                    name: 'mode', decorators: [{ name: 'Attribute', arguments: [] }],
                    type: { kind: 'union', nested: [
                        { kind: 'literal', value: '"small"', isArray: false },
                        { kind: 'literal', value: '"large"', isArray: false },
                    ], isArray: false },
                    documentation: { definitions: ['Display mode'] },
                },
                active: { name: 'active', decorators: [], type: { kind: 'type', value: 'boolean', genericValue: [], isArray: false } },
            },
            propertiesStatic: {}, methods: {}, methodsStatic: {}, decorators: [],
            documentation: { definitions: ['Card documentation'], documentationSlots: { body: 'Card body' } },
        };
        const file = Object.create(AventusWebComponentLogicalFile.prototype);
        file._file = { uri };
        file._componentClassName = 'Card';
        file._compileResult = [{ classScript: 'Demo.Card', tagName: 'demo-card' }];
        file.fileParsed = { classes: { Card: cls } };
        const build = {
            buildConfig: { fullname: 'Demo@Main', module: 'Demo' },
            project: { getConfigFile: () => ({ uri: 'file:///project/aventus.conf.avt' }) },
            externalPackageInformation: { getByUri: () => undefined },
            tsFiles: { [uri]: file }, noNamespaceUri: {},
            scssFiles: { 'file:///project/Card.wcs.avt': { customProperties: [{ name: '--card-color', type: '<color>', defaultValue: 'red', documentation: 'Card color' }] } },
            htmlFiles: { 'file:///project/Card.wcv.avt': { fileParsed: { slotsInfo: { body: {} }, blocksInfo: {} } } },
        };
        file._build = build;
        const manifest = new Manifest({}, build);
        manifest.register(file);
        await manifest.write(root);
        const json = name => JSON.parse(readFileSync(join(root, name), 'utf8'));
        const declaration = json('custom-elements.json').modules[0].declarations[0];
        const html = json('vscode.html-custom-data.json').tags[0];
        const web = json('web-types.json').contributions.html.elements[0];
        const emmet = json(join('emmet', 'snippets.json'));
        assert.equal(declaration.tagName, 'demo-card');
        assert.deepEqual(declaration.attributes.map(attribute => attribute.name), ['mode']);
        assert.deepEqual(declaration.members.map(member => member.name), ['active', 'mode']);
        assert.deepEqual(declaration.cssProperties, [{ name: '--card-color', default: 'red', description: 'Card color', syntax: '<color>' }]);
        assert.deepEqual(declaration.slots, [{ name: 'body' }]);
        assert.deepEqual(html.attributes[0].values, [{ name: 'small' }, { name: 'large' }]);
        assert.deepEqual(web.attributes[0].values, [{ type: 'small' }, { type: 'large' }]);
        assert.deepEqual(web.slots, [{ name: 'body', description: 'Card body' }]);
        assert.equal(emmet.html.snippets['demo-card'], '<demo-card>${1}</demo-card>');
    } finally {
        SettingsManager.instance = previousSettings;
        rmSync(root, { recursive: true, force: true });
    }
});
