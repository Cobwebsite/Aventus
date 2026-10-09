import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTemplateLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/template/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { _extensionPath: process.cwd(), logLevel: 99 };

function script(source, version = 1) {
    const uri = 'file:///d%3A/templates/navigation/template.avt.ts';
    const documentInternal = TextDocument.create(uri, 'typescript', version, source);
    return { uri, documentInternal, contentInternal: source, versionInternal: version };
}

function at(file, word, occurrence = 0) {
    let offset = -1;
    for (let i = 0; i <= occurrence; i++) offset = file.contentInternal.indexOf(word, offset + 1);
    assert.ok(offset >= 0, `missing ${word}`);
    return file.documentInternal.positionAt(offset + 1);
}

test('template script resolves an inherited API definition to the template declaration', async () => {
    const service = new AventusTemplateLanguageService();
    const file = script('class Demo extends AventusTemplate { meta() { return { name: "Demo" }; } async run(destination: string) { this.registerVar("color", "blue"); } }');
    service.addFile(file);
    try {
        const definitions = await service.findDefinition(file, at(file, 'registerVar'));
        assert.ok(definitions?.length);
        assert.match(definitions[0].uri.replaceAll('\\', '/'), /lib\/templateScript\/AventusTemplate\.d\.ts$/);
        assert.equal(definitions[0].range.start.line > 0, true);
    } finally {
        service.removeFile(file);
    }
});

test('template script local symbol navigation currently has no location despite a valid declaration', async () => {
    const service = new AventusTemplateLanguageService();
    const file = script('export class Demo { value = 1; run() { return this.value; } }');
    service.addFile(file);
    try {
        assert.deepEqual(service.doValidation(file), []);
        assert.equal(await service.findDefinition(file, at(file, 'value', 1)), null);
    } finally {
        service.removeFile(file);
    }
});

test('template script validation follows the updated buffer and recovers after removal and reopening', () => {
    const service = new AventusTemplateLanguageService();
    const file = script('export class Demo { value = 1; run() { return this.value; } }');
    service.addFile(file);
    try {
        assert.deepEqual(service.doValidation(file), []);
        const broken = 'export class Demo { value = 1; run() { return this.unknown; } }';
        file.documentInternal = TextDocument.create(file.uri, 'typescript', 2, broken);
        file.contentInternal = broken;
        file.versionInternal = 2;
        assert.ok(service.doValidation(file).some(diagnostic => /unknown/.test(diagnostic.message)));
        service.removeFile(file);
        const reopened = script('export class Demo { value = 2; run() { return this.value; } }', 3);
        service.addFile(reopened);
        assert.deepEqual(service.doValidation(reopened), []);
        service.removeFile(reopened);
    } finally {
        service.removeFile(file);
    }
});
