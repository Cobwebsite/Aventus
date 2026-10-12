import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusTemplateLanguageService }, { GenericServer }] = await loadServerModules([
    'language-services/ts/template/LanguageService.ts', 'GenericServer.ts',
]);
GenericServer.instance = { _extensionPath: process.cwd(), logLevel: 99 };

function script(source, version = 1) {
    const uri = 'file:///d%3A/templates/round78/template.avt.ts';
    const documentInternal = TextDocument.create(uri, 'typescript', version, source);
    return { uri, documentInternal, contentInternal: source, versionInternal: version };
}

function change(file, source, version) {
    file.documentInternal = TextDocument.create(file.uri, 'typescript', version, source);
    file.contentInternal = source;
    file.versionInternal = version;
}

test('template semantic error identifies the edited member and disappears after correction', () => {
    const service = new AventusTemplateLanguageService();
    const file = script('export class Demo { run() { return this.missing; } }');
    service.addFile(file);
    try {
        const diagnostics = service.doValidation(file);
        const error = diagnostics.find(item => /missing/.test(item.message));
        assert.ok(error, JSON.stringify(diagnostics));
        assert.equal(file.documentInternal.getText(error.range), 'missing');
        assert.equal(error.severity, 1);

        change(file, 'export class Demo { missing = 1; run() { return this.missing; } }', 2);
        assert.deepEqual(service.doValidation(file), []);
    } finally {
        service.removeFile(file);
    }
});

test('template completion follows buffer edits and exposes the inherited template API', async () => {
    const service = new AventusTemplateLanguageService();
    const file = script('class Demo extends AventusTemplate { first = 1; run() { this. } }');
    service.addFile(file);
    try {
        const complete = async () => service.doComplete(file, file.documentInternal.positionAt(file.contentInternal.indexOf('this.') + 5));
        const first = await complete();
        assert.ok(first.items.some(item => item.label === 'first'));
        assert.ok(first.items.some(item => item.label === 'registerVar'));

        change(file, 'class Demo extends AventusTemplate { second = 2; run() { this. } }', 2);
        const second = await complete();
        assert.ok(second.items.some(item => item.label === 'second'));
        assert.equal(second.items.some(item => item.label === 'first'), false);
    } finally {
        service.removeFile(file);
    }
});
