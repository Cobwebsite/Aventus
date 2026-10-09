import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { ParserTs }, { GenericServer }] = await loadServerModules([
    'language-services/ts/FileSelector.ts',
    'language-services/ts/parser/ParserTs.ts',
    'GenericServer.ts',
]);
GenericServer.instance = { logLevel: 4, _extensionPath: process.cwd() };

function parse(uri, source, build) {
    const document = TextDocument.create(uri, 'typescript', 1, source);
    return ParserTs.parse({ uri, versionInternal: 1, documentUser: document, documentInternal: document }, false, build);
}

function withFiles(sources, run) {
    const dir = mkdtempSync(join(process.cwd(), 'aventus-ts-import-round34-'));
    try {
        const uris = {};
        for (const [name, source] of Object.entries(sources)) {
            const path = join(dir, name);
            writeFileSync(path, source);
            uris[name] = pathToFileURL(path).href;
        }
        const build = {
            npmBuilder: { unregister() {}, register() {} }, buildConfig: {}, hasNpmOutput: false,
            namespaces: [],
            project: { resolveAlias: name => name },
            getNamespaceForUri: () => '', getNpmReplacementName: () => '',
        };
        return run(uris, build);
    }
    finally { rmSync(dir, { recursive: true, force: true }); }
}

test('imports locaux aliasés : classe et interface gardent la déclaration source et la plage du nom importé', () => withFiles({
    'base.lib.avt': 'export interface Shape { size: number; }\nexport class Parent { value: number = 1; }',
    'owner.lib.avt': 'import { Parent as Base, Shape as Form } from "./base.lib.avt";\nexport class Child extends Base implements Form { size: number = 2; }',
}, (uris, build) => {
    const source = 'import { Parent as Base, Shape as Form } from "./base.lib.avt";\nexport class Child extends Base implements Form { size: number = 2; }';
    const owner = parse(uris['owner.lib.avt'], source, build);
    const parsedBaseUri = Object.keys(ParserTs.parsedDoc).find(uri => uri.endsWith('/base.lib.avt') && uri.includes('round34'));
    const base = ParserTs.parsedDoc[parsedBaseUri]?.result;
    assert.ok(base);
    assert.equal(owner.importsLocal.Base.info, base.classes.Parent);
    assert.equal(owner.importsLocal.Form.info, base.classes.Shape);
    assert.equal(base.classes.Shape.isInterface, true);
    assert.equal(owner.importsLocal.Base.name, 'Parent');
    assert.equal(owner.importsLocal.Base.alias, 'Base');
    assert.equal(source.slice(owner.importsLocal.Base.nameStart, owner.importsLocal.Base.nameEnd), 'Parent');
    assert.equal(source.slice(owner.importsLocal.Form.nameStart, owner.importsLocal.Form.nameEnd), 'Shape');
    assert.deepEqual(owner.classes.Child.extends, ['Parent']);
    assert.deepEqual(owner.classes.Child.implements, ['Shape']);
    assert.equal(owner.classes.Child.parentClass, base.classes.Parent);
}));

test('import local incomplet : diagnostic borné au symbole demandé', () => withFiles({
    'base.lib.avt': 'export class Parent {}',
    'owner.lib.avt': 'import { Missing } from "./base.lib.avt"; export class Child {}',
}, (uris, build) => {
    const source = 'import { Missing } from "./base.lib.avt"; export class Child {}';
    const owner = parse(uris['owner.lib.avt'], source, build);
    const issue = owner.errors.find(error => error.message.includes("Can't load") && error.message.includes('Missing'));
    assert.ok(issue);
    assert.equal(owner.document.getText(issue.range), 'Missing');
    assert.equal(owner.importsLocal.Missing.info, undefined);
}));
