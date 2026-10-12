import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { Storie }, { SettingsManager }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts', 'project/storybook/Stories.ts',
    'settings/Settings.ts', 'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4 };

test('Storybook generates parser-derived class, alias, enum, function and variable stories', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-parser-kinds-'));
    const previous = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const config = { module: 'Demo', stories: { output: root, prefix: 'Library', format: 'public' } };
        const build = {
            module: 'Demo', buildConfig: config, noNamespaceUri: {}, npmBuilder: { unregister() {} }, hasNpmOutput: false,
            getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        };
        const uri = `file:///${root.replaceAll('\\', '/')}/declarations.lib.avt`;
        const document = TextDocument.create(uri, 'typescript', 1, `
            namespace Catalog {
                /** Class documentation. */
                @Storybook({group:"Models"})
                export class Item {}

                /** Alias documentation. */
                @Storybook({group:"Models"})
                export type Name = string;

                /** Enum documentation. */
                @Storybook({group:"Models"})
                export enum Tone { Light, Dark }

                /** Function documentation. */
                @Storybook({group:"Models"})
                export function format(value: string): string { return value; }

                /** Variable documentation. */
                @Storybook({group:"Models"})
                export const count = 1;
            }
        `);
        const file = { uri, versionInternal: 1, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        const expected = [
            ['classes', 'Item', 'class'], ['aliases', 'Name', 'type'], ['enums', 'Tone', 'enum'],
            ['functions', 'format', 'function'], ['variables', 'count', 'variable'],
        ];
        for (const [section, name] of expected) {
            assert.ok(parsed[section][name]?.storieContent, `${section}.${name} should have parser-derived story data`);
        }
        await new Storie(build, config).write({ [uri]: { fileParsed: parsed } }, true);
        for (const [, name, kind] of expected) {
            const path = join(root, 'auto', 'Catalog', `${name}.stories.ts`);
            assert.ok(existsSync(path), `${name} story should be generated`);
            const source = readFileSync(path, 'utf8');
            assert.match(source, new RegExp(`Library/Models/${name}`));
            assert.match(source, new RegExp(`"kind": "${kind}"`));
            assert.deepEqual(ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true).parseDiagnostics, []);
            assert.match(readFileSync(join(root, 'auto', 'Catalog', `${name}_.mdx`), 'utf8'), new RegExp(`av-story-${kind}-render`));
        }
    } finally {
        SettingsManager.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
