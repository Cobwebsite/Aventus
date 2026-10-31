import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Storie }, { SettingsManager }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'project/storybook/Stories.ts', 'settings/Settings.ts', 'language-services/ts/component/File.ts',
]);

function declaration(name, kind, description, config) {
    return {
        name, fullName: `Demo.${name}`,
        build: { buildConfig: config },
        storieContent: { kind, namespace: 'Demo' },
        documentation: { definitions: [description] },
    };
}

function parsed(declarations) {
    return {
        fileParsed: {
            classes: declarations.classes ?? {},
            aliases: declarations.aliases ?? {},
            enums: declarations.enums ?? {},
            functions: declarations.functions ?? {},
            variables: declarations.variables ?? {},
        },
    };
}

test('Storybook regenerates declarations across files after a rename and preserves manual stories', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-declarations-'));
    const previousSettings = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const config = { stories: { output: root, prefix: 'Library' } };
        const stories = new Storie({}, config);
        const card = declaration('Card', 'class', 'Card version one', config);
        const tone = declaration('Tone', 'enum', 'Color tone', config);
        const size = declaration('Size', 'alias', 'Size alias', config);
        const files = {
            card: parsed({ classes: { Card: card }, enums: { Tone: tone } }),
            types: parsed({ aliases: { Size: size } }),
        };
        writeFileSync(join(root, 'manual.stories.ts'), 'user owned');

        await stories.write(files, true);
        const auto = join(root, 'auto', 'Demo');
        for (const [name, kind] of [['Card', 'class'], ['Tone', 'enum'], ['Size', 'alias']]) {
            assert.match(readFileSync(join(auto, `${name}.stories.ts`), 'utf8'), new RegExp(`Library/Demo/${name}`));
            assert.match(readFileSync(join(auto, `${name}_.mdx`), 'utf8'), new RegExp(`<av-story-${kind}-render`));
        }

        const tile = declaration('Tile', 'class', 'Tile version two', config);
        files.card = parsed({ classes: { Tile: tile } });
        size.documentation.definitions = ['Updated size alias'];
        await stories.write(files, true);

        assert.equal(existsSync(join(auto, 'Card.stories.ts')), false);
        assert.equal(existsSync(join(auto, 'Card_.mdx')), false);
        assert.equal(existsSync(join(auto, 'Tone.stories.ts')), false);
        assert.equal(existsSync(join(auto, 'Tone_.mdx')), false);
        assert.match(readFileSync(join(auto, 'Tile.stories.ts'), 'utf8'), /Tile version two/);
        assert.match(readFileSync(join(auto, 'Size.stories.ts'), 'utf8'), /Updated size alias/);
        assert.equal(readFileSync(join(root, 'manual.stories.ts'), 'utf8'), 'user owned');
    } finally {
        SettingsManager.instance = previousSettings;
        rmSync(root, { recursive: true, force: true });
    }
});

test('Storybook emits parseable component args for string, empty, boolean and numeric defaults', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-defaults-'));
    try {
        const config = { stories: { output: root } };
        const info = declaration('Card', 'component', 'Card defaults', config);
        const file = Object.create(AventusWebComponentLogicalFile.prototype);
        file._componentClassName = 'Card';
        file.fileParsed = { classes: { Card: info } };
        file.storyBookInfo = {
            argsTypes: {
                title: { control: 'text' },
                active: { control: 'boolean' },
                count: { control: 'number' },
            },
            args: { title: '"Hello"', empty: '', active: 'false', count: '0' },
        };
        const story = new Storie({}, config);
        const outputs = new Map();
        story.writeFile = async (path, content) => outputs.set(path, content);
        await story.writeStory(info, file);

        const source = [...outputs.entries()].find(([path]) => path.endsWith('.stories.ts'))?.[1];
        assert.ok(source);
        const parsed = ts.createSourceFile('Card.stories.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        assert.deepEqual(parsed.parseDiagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')), []);
        assert.match(source, /"title":"Hello"/);
        assert.match(source, /"empty":""/);
        assert.match(source, /"active":false/);
        assert.match(source, /"count":0/);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
