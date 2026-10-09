import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ ManifestPackageMd }, { Storie }, { AventusWebComponentLogicalFile }, { TypeInfo }] =
    await loadServerModules([
        'manifest/ManifestPackage.ts', 'project/storybook/Stories.ts',
        'language-services/ts/component/File.ts', 'language-services/ts/parser/TypeInfo.ts',
    ]);

test('package Markdown exposes public instance and static members but omits private members', () => {
    const syntax = ts.createSourceFile('card.ts', `class Card {
        title: string; private secret: string;
        static version: number;
        open(value: string): boolean { return true; }
        protected close(): void {}
    }`, ts.ScriptTarget.Latest, true);
    const declaration = syntax.statements[0];
    const [title, secret, version, open, close] = declaration.members;
    const property = (node, hidden = false) => ({
        name: node.name.getText(), type: new TypeInfo(node.type),
        isPrivate: hidden, isProtected: false, decorators: [],
        documentation: { definitions: [`Documentation for ${node.name.getText()}`] },
    });
    const method = (node, protectedMember = false) => ({
        name: node.name.getText(), node, isPrivate: false, isProtected: protectedMember,
        isAbstract: false, documentation: { definitions: [`Documentation for ${node.name.getText()}`] },
    });
    const source = {
        name: 'widgets', file: { uri: 'file:///widgets.package.avt' },
        build: { scssLanguageService: { getExternalDefinition: () => ({}) } },
        srcInfo: { available: [{ type: 1, fullName: 'Demo.Card' }] },
        fileParsed: { classes: { 'Demo.Card': {
            fullName: 'Demo.Card', name: 'Card', namespace: 'Demo', node: declaration,
            isWebcomponent: false, isInterface: false, parentClass: null, implementsType: [],
            properties: { title: property(title), secret: property(secret, true) },
            propertiesStatic: { version: property(version) },
            methods: { open: method(open), close: method(close, true) }, methodsStatic: {},
        } } },
    };
    const markdown = new ManifestPackageMd(source).getContent();
    assert.match(markdown, /### JS Props\s+[\s\S]*\| title \| string \| Documentation for title \|/);
    assert.match(markdown, /### JS Props Static\s+[\s\S]*\| version \| number \|/);
    assert.match(markdown, /\| open\(value: string\) \| boolean \| Documentation for open \|/);
    assert.doesNotMatch(markdown, /secret|close\(/);
});

function storyFixture(root, overrides = {}) {
    const info = {
        name: 'Card', fullName: 'Demo.Card', isAbstract: false,
        build: { buildConfig: { stories: { prefix: 'Library' } } },
        storieContent: { kind: 'component', namespace: 'Demo' },
        storieInject: {}, ...overrides,
    };
    const file = Object.create(AventusWebComponentLogicalFile.prototype);
    file._componentClassName = 'Card';
    file.fileParsed = { classes: { Card: info } };
    file.storyBookInfo = { argsTypes: {}, args: {} };
    const story = new Storie({}, { stories: { output: root, prefix: 'Library' } });
    const output = new Map();
    story.writeFile = async (path, content) => output.set(path, content);
    return { info, file, story, output };
}

test('Storybook excludes live controls for an abstract component', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-story-abstract-'));
    try {
        const { info, file, story, output } = storyFixture(root, { isAbstract: true });
        await story.writeStory(info, file);
        const mdx = [...output.entries()].find(([path]) => path.endsWith('_.mdx'))?.[1];
        const source = [...output.entries()].find(([path]) => path.endsWith('.stories.ts'))?.[1];
        assert.equal(output.size, 2);
        assert.doesNotMatch(mdx, /<Canvas \/>|<Controls \/>/);
        assert.doesNotMatch(source, /render: \(args\) => render\(args, Card\)/);
        assert.match(source, /Library\/Demo\/Card/);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('Storybook noDefaultStory also suppresses component live controls', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-story-no-default-'));
    try {
        const { info, file, story, output } = storyFixture(root, { storieDecorator: { noDefaultStory: true } });
        await story.writeStory(info, file);
        const mdx = [...output.entries()].find(([path]) => path.endsWith('_.mdx'))?.[1];
        const source = [...output.entries()].find(([path]) => path.endsWith('.stories.ts'))?.[1];
        assert.doesNotMatch(mdx, /<Canvas \/>|<Controls \/>/);
        assert.doesNotMatch(source, /export const DefaultStory|render: \(args\) => render\(args, Card\)/);
        assert.match(source, /aventus:/);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
