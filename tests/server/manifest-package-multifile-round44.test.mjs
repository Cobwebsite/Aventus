import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ManifestPackage, ManifestPackageMd }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'manifest/ManifestPackage.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

test('registering two package sources updates one Emmet file with both tags', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-manifest-packages-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previous = {
        server: GenericServer.instance, settings: SettingsManager.instance,
        files: ManifestPackage.files, done: ManifestPackage.done,
    };
    t.after(() => {
        GenericServer.instance = previous.server;
        SettingsManager.instance = previous.settings;
        ManifestPackage.files = previous.files;
        ManifestPackage.done = previous.done;
    });
    GenericServer.instance = { workspaces: [pathToFileURL(root).href] };
    SettingsManager.instance = { settings: { useStats: false } };
    ManifestPackage.files = {};
    ManifestPackage.done = false;
    const packageFile = (name, tagName) => ({
        file: { uri: pathToFileURL(join(root, `${name}.package.avt`)).href },
        srcInfo: { available: [{ tagName }] },
    });
    const output = join(root, '.aventus', 'emmet', 'snippets.json');
    await ManifestPackage.register(packageFile('cards', 'demo-card'));
    assert.equal(existsSync(output), false);
    await ManifestPackage.write(true);
    await ManifestPackage.register(packageFile('panels', 'demo-panel'));
    const snippets = JSON.parse(readFileSync(output, 'utf8')).html.snippets;
    assert.deepEqual(Object.keys(snippets).sort(), ['block', 'demo-card', 'demo-panel']);
    assert.equal(snippets['demo-card'], '<demo-card>${1}</demo-card>');
    assert.equal(snippets['demo-panel'], '<demo-panel>${1}</demo-panel>');
});

test('Markdown for mixed real declarations documents the function while omitting enum and variable', () => {
    const source = ts.createSourceFile('exports.ts', `
        export class Anchor {}
        export function select<T extends string>(value: T): T | undefined { return value; }
        export enum Mode { Ready }
        export const VERSION = 2;
    `, ts.ScriptTarget.Latest, true);
    const [classNode, functionNode, enumNode, variableNode] = source.statements;
    const file = {
        name: 'mixed', file: { uri: 'file:///mixed.package.avt' },
        build: { scssLanguageService: { getExternalDefinition: () => ({}) } },
        srcInfo: { available: [
            { type: 1, fullName: 'Demo.Anchor' },
            { type: 4, fullName: 'select' },
            { type: 6, fullName: 'Mode' },
            { type: 5, fullName: 'VERSION' },
        ] },
        fileParsed: {
            classes: { 'Demo.Anchor': {
                fullName: 'Demo.Anchor', name: 'Anchor', namespace: 'Demo',
                isWebcomponent: false, isInterface: false, node: classNode,
                parentClass: null, implementsType: [], properties: {},
                propertiesStatic: {}, methods: {}, methodsStatic: {},
            } },
            functions: { select: { fullName: 'select', node: functionNode } },
            enums: { Mode: { fullName: 'Mode', node: enumNode } },
            variables: { VERSION: { fullName: 'VERSION', node: variableNode } },
        },
    };
    const markdown = new ManifestPackageMd(file).getContent();
    assert.match(markdown, /## select<T extends string>\(value: T\)/);
    assert.match(markdown, /Return : T &vert; undefined/);
    assert.doesNotMatch(markdown, /\bMode\b|\bVERSION\b/);
});
