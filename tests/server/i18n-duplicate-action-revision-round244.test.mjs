import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';
import { applyI18nAction } from './helpers/i18n-edits.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('une correction de locale conserve le doublon entre fichiers jusqu’au renommage de la clé', async t => {
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const create = (name, content) => {
        const uri = `file:///D:/round244/${name}.i18n.avt`;
        const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, content));
        const translation = new AventusI18nFile(source, true, build);
        build.tsLanguageService.i18nFiles[uri] = translation;
        return {
            uri, source, translation,
            edit: (version, text) => source.triggerContentChange(TextDocument.create(uri, 'json', version, text)),
        };
    };
    const first = create('first', '{"shared":{"en":"First"},"own":{"en":"Only","fr":"Seul"}}');
    const second = create('second', '{"shared":{"en":"Second","fr":"Deuxième"}}');
    t.after(async () => {
        for (const item of [first, second]) {
            clearTimeout(item.source.delayValidate);
            await item.source.triggerDelete();
        }
    });
    const messages = async item => (await item.source.validate(false)).map(d => d.message);
    const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };

    assert.deepEqual(await messages(first), [
        'Duplicate translation key shared across global files', 'Missing locales fr',
    ]);
    assert.deepEqual(await messages(second), ['Duplicate translation key shared across global files']);
    assert.deepEqual(first.translation.exported, {
        en: { shared: 'First', own: 'Only' }, fr: { own: 'Seul' },
    });

    const [action] = await first.source.getCodeAction(range);
    assert.equal(action.title, 'Import missing locales');
    assert.deepEqual(Object.keys(action.edit.changes), [first.uri]);
    const repaired = applyI18nAction(first.source.documentUser, action);
    assert.equal(JSON.parse(repaired).shared.fr, 'ⵌⵌ');
    await first.edit(2, repaired);
    assert.deepEqual(await messages(first), [
        'Duplicate translation key shared across global files', 'Translation not set',
    ]);
    assert.deepEqual(await messages(second), ['Duplicate translation key shared across global files']);
    assert.deepEqual(first.translation.exported.fr, { shared: 'ⵌⵌ', own: 'Seul' });

    await first.edit(3, repaired.replace('ⵌⵌ', 'Premier'));
    assert.deepEqual(await messages(first), ['Duplicate translation key shared across global files']);
    assert.deepEqual(await first.source.getCodeAction(range), []);
    assert.deepEqual(first.translation.exported.fr, { shared: 'Premier', own: 'Seul' });

    await second.edit(2, '{"renamed":{"en":"Second","fr":"Deuxième"}}');
    assert.deepEqual(await messages(first), []);
    assert.deepEqual(await messages(second), []);
    assert.deepEqual(first.translation.keys, ['shared', 'own']);
    assert.deepEqual(second.translation.keys, ['renamed']);
    assert.deepEqual(second.translation.exported, {
        en: { renamed: 'Second' }, fr: { renamed: 'Deuxième' },
    });
});
