import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

function fixture(t, name, content) {
    const uri = `file:///D:/round162/${name}.i18n.avt`;
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, content));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => { clearTimeout(source.delayValidate); await source.triggerDelete(); });
    return { source, translation, build, change: (version, text) => source.triggerContentChange(TextDocument.create(uri, 'json', version, text)) };
}

test('renommer une clé i18n met à jour exports et déclaration générée sans garder l’ancienne clé', async t => {
    const { source, translation, change } = fixture(t, 'rename-key', '{"old":{"en":"Old","fr":"Ancien"}}');
    assert.deepEqual(translation.keys, ['old']);
    await change(2, '{"current":{"en":"Current","fr":"Actuel"}}');
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(translation.keys, ['current']);
    assert.deepEqual(translation.exported, { en: { current: 'Current' }, fr: { current: 'Actuel' } });
    assert.match(source.documentInternal.getText(), /"current": string/);
    assert.doesNotMatch(source.documentInternal.getText(), /"old"/);
});

test('ajouter puis retirer une locale configurée recalcule les diagnostics du même fichier', async t => {
    const { source, translation, build, change } = fixture(t, 'locale-config', '{"hello":{"en":"Hello","fr":"Bonjour"}}');
    assert.deepEqual(await source.validate(false), []);
    build.buildConfig.i18n.locales = ['en', 'fr', 'de'];
    await change(2, '{"hello":{"en":"Hello","fr":"Bonjour"}}');
    assert.ok((await source.validate(false)).some(item => item.message.includes('Missing locales de')));

    await change(3, '{"hello":{"en":"Hello","fr":"Bonjour","de":"Hallo"}}');
    assert.deepEqual(await source.validate(false), []);
    assert.equal(translation.exported.de.hello, 'Hallo');

    build.buildConfig.i18n.locales = ['en', 'fr'];
    await change(4, '{"hello":{"en":"Hello","fr":"Bonjour"}}');
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual(Object.keys(translation.exported), ['en', 'fr']);
});
