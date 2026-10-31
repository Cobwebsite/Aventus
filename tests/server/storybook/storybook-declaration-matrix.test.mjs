import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Storie }, { SettingsManager }] = await loadServerModules([
    'project/storybook/Stories.ts', 'settings/Settings.ts',
]);

test('Storybook writes distinct TS and MDX pairs for every non-component declaration kind', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-kinds-'));
    const previousSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const config = { stories: { output: root, prefix: 'Library' } };
        const kinds = [
            ['classes', 'Widget', 'class'],
            ['aliases', 'Shape', 'alias'],
            ['enums', 'Tone', 'enum'],
            ['functions', 'format', 'function'],
            ['variables', 'count', 'variable'],
        ];
        const parsed = { classes: {}, aliases: {}, enums: {}, functions: {}, variables: {} };
        for (const [section, name, kind] of kinds) {
            parsed[section][name] = {
                name, fullName: `Demo.Nested.${name}`,
                build: { buildConfig: config },
                storieContent: { kind, namespace: 'Demo.Nested' },
                storieDecorator: { group: 'Public', prefix: 'API/' },
                documentation: { definitions: [`Documentation for ${name}`] },
            };
        }
        await new Storie({}, config).write({ declarations: { fileParsed: parsed } }, true);
        for (const [, name, kind] of kinds) {
            const folder = join(root, 'auto', 'Demo', 'Nested');
            const source = readFileSync(join(folder, `${name}.stories.ts`), 'utf8');
            const mdx = readFileSync(join(folder, `${name}_.mdx`), 'utf8');
            const tree = ts.createSourceFile(`${name}.stories.ts`, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
            assert.deepEqual(tree.parseDiagnostics, [], `${kind} story should parse`);
            assert.match(source, new RegExp(`API/Public/${name}`));
            assert.match(source, new RegExp(`Documentation for ${name}`));
            assert.match(source, new RegExp(`"kind": "${kind}"`));
            assert.match(mdx, new RegExp(`<av-story-${kind}-render`));
            assert.doesNotMatch(mdx, /<Canvas\s*\/>|<Controls\s*\/>/);
        }
    } finally {
        SettingsManager.instance = previousSettings;
        rmSync(root, { recursive: true, force: true });
    }
});
