import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
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

test('Storybook turns literal JSDoc interpolation syntax into a generated template expression', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-storybook-description-'));
    const previous = SettingsManager.instance;
    SettingsManager.instance = { settings: { useStats: false } };
    try {
        const config = { module: 'Demo', stories: { output: root, prefix: 'Library', format: 'public' } };
        const build = {
            module: 'Demo', buildConfig: config, noNamespaceUri: {}, npmBuilder: { unregister() {} }, hasNpmOutput: false,
            getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        };
        const uri = `file:///${root.replaceAll('\\', '/')}/description.lib.avt`;
        const document = TextDocument.create(uri, 'typescript', 1, `
            namespace Catalog {
                /** Shows the literal \${name} marker. */
                @Storybook({group:"Models"})
                export class Item {}
            }
        `);
        const file = { uri, versionInternal: 1, documentUser: document, documentInternal: document };
        const parsed = ParserTs.parse(file, false, build);
        assert.match(parsed.classes.Item.documentation.definitions.join(' '), /\$\{name\}/);
        await new Storie(build, config).write({ [uri]: { fileParsed: parsed } }, true);
        const storyPath = join(root, 'auto', 'Catalog', 'Item.stories.ts');
        const output = readFileSync(storyPath, 'utf8');
        const source = ts.createSourceFile(storyPath, output, ts.ScriptTarget.Latest, true);
        assert.deepEqual(source.parseDiagnostics, []);
        assert.match(output, /literal \$\{name\} marker/);
        const template = source.statements
            .find(statement => ts.isVariableStatement(statement))
            ?.declarationList.declarations[0].initializer
            ?.properties.find(property => property.name?.text === 'parameters')
            ?.initializer.properties.find(property => property.name?.text === 'docs')
            ?.initializer.properties.find(property => property.name?.text === 'description')
            ?.initializer.properties.find(property => property.name?.text === 'component')
            ?.initializer;
        assert.ok(ts.isTemplateExpression(template));
        assert.equal(template.templateSpans[0].expression.getText(source), 'name');
    } finally {
        SettingsManager.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
