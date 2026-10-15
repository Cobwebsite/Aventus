import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { ManifestPackageMd }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts', 'language-services/ts/parser/ParserTs.ts',
    'manifest/ManifestPackage.ts', 'GenericServer.ts',
]);

test('package Markdown updates parsed class parent after edits', t => {
    const previousServer = GenericServer.instance;
    t.after(() => { GenericServer.instance = previousServer; });
    GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };
    const uri = 'file:///project/widgets.package.avt';
    const build = {
        npmBuilder: { unregister() {} }, buildConfig: {}, hasNpmOutput: false, namespaces: [],
        getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        scssLanguageService: { getExternalDefinition: () => ({}) },
    };
    const file = {
        name: 'widgets', file: { uri }, build,
        srcInfo: { available: [{ type: 1, fullName: 'Card' }] },
        fileParsed: null,
    };
    const render = (version, source) => {
        const document = TextDocument.create(uri, 'typescript', version, source);
        file.fileParsed = ParserTs.parse({ uri, versionInternal: version, documentUser: document, documentInternal: document }, false, build);
        return new ManifestPackageMd(file).getContent();
    };

    const first = render(1, `
        interface Clickable { click(): void; }
        class BaseCard {}
        /** Card documentation. */ export class Card extends BaseCard implements Clickable {
            click(): void {}
        }
    `);
    assert.match(first, /## Card[\s\S]* - Parent : BaseCard/);
    assert.doesNotMatch(first, / - Implements : Clickable/);

    const second = render(2, `
        interface Selectable { select(): void; }
        class NewBase {}
        /** Revised card. */ export class Card extends NewBase implements Selectable {
            select(): void {}
        }
    `);
    assert.match(second, /## Card[\s\S]* - Parent : NewBase/);
    assert.doesNotMatch(second, / - Implements : Selectable/);
    assert.doesNotMatch(second, /BaseCard|Clickable|click\(\)/);

    const third = render(3, `/** Plain card. */ export class Card { open(): void {} }`);
    assert.match(third, /## Card[\s\S]*Plain card/);
    assert.doesNotMatch(third, / - Parent : | - Implements : |NewBase|Selectable/);
});
