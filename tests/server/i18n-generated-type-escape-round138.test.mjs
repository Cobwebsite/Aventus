import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts',
    'language-services/i18n/File.ts',
]);

function declaredKeys(parsed) {
    const keys = [];
    function visit(node) {
        if (ts.isPropertySignature(node)) keys.push(node.name.text);
        ts.forEachChild(node, visit);
    }
    visit(parsed);
    return keys;
}

test('une clé i18n contenant un saut de ligne reste valide dans le type généré', async t => {
    const uri = 'file:///D:/round138/messages.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        JSON.stringify({ 'line\nbreak': { en: 'Line', fr: 'Ligne' } })));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });

    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.keys, ['line\nbreak']);
    assert.equal(translation.exported.en['line\nbreak'], 'Line');
    const generated = source.documentInternal.getText();
    assert.ok(generated.includes('"line\\nbreak": string'));
    const parsed = ts.createSourceFile('i18n.d.ts', generated, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    assert.equal(parsed.parseDiagnostics.length, 0);
    assert.deepEqual(declaredKeys(parsed), ['line\nbreak']);

    await source.triggerContentChange(TextDocument.create(uri, 'json', 2,
        JSON.stringify({ 'line-break': { en: 'Line', fr: 'Ligne' } })));
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.keys, ['line-break']);
    const repaired = source.documentInternal.getText();
    assert.equal(ts.createSourceFile('i18n.d.ts', repaired, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS).parseDiagnostics.length, 0);
});

test('une clé i18n contenant une séquence antislash-t garde son nom dans le type généré', async t => {
    const uri = 'file:///D:/round138/escape.i18n.avt';
    const key = 'backslash\\t';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1,
        JSON.stringify({ [key]: { en: 'Value' } })));
    const build = {
        buildConfig: { i18n: { locales: ['en'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });

    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.keys, [key]);
    assert.equal(translation.exported.en[key], 'Value');
    const generated = source.documentInternal.getText();
    const parsed = ts.createSourceFile('i18n.d.ts', generated, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    assert.equal(parsed.parseDiagnostics.length, 0);
    assert.deepEqual(declaredKeys(parsed), [key]);

    await source.triggerContentChange(TextDocument.create(uri, 'json', 2,
        JSON.stringify({ backslash_t: { en: 'Value' } })));
    assert.deepEqual(await source.validate(false), []);
    const repaired = ts.createSourceFile('i18n.d.ts', source.documentInternal.getText(), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    assert.deepEqual(declaredKeys(repaired), ['backslash_t']);
});
