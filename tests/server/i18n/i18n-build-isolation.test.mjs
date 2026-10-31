import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('les doublons, diagnostics de locales et exports restent isolés entre deux builds après éditions', async t => {
    const makeBuild = locales => ({
        buildConfig: { i18n: { locales, fallback: locales[0] } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    });
    const firstBuild = makeBuild(['en', 'fr']);
    const secondBuild = makeBuild(['en', 'de']);
    const files = [];
    const makeFile = (build, name, content) => {
        const uri = `file:///D:/round229/${name}.i18n.avt`;
        const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, content));
        const translation = new AventusI18nFile(source, true, build);
        build.tsLanguageService.i18nFiles[uri] = translation;
        const entry = { uri, source, translation, edit: (version, text) => source.triggerContentChange(TextDocument.create(uri, 'json', version, text)) };
        files.push(entry);
        return entry;
    };
    const first = makeFile(firstBuild, 'first', '{"shared":{"en":"One","fr":"Un"}}');
    const sibling = makeFile(firstBuild, 'sibling', '{"shared":{"en":"Two","fr":"Deux"}}');
    const independent = makeFile(secondBuild, 'independent', '{"shared":{"en":"Three","de":"Drei"}}');
    t.after(async () => {
        for (const entry of files) {
            clearTimeout(entry.source.delayValidate);
            await entry.source.triggerDelete();
        }
    });
    const messages = async entry => (await entry.source.validate(false)).map(diagnostic => diagnostic.message);

    assert.deepEqual(await messages(first), ['Duplicate translation key shared across global files']);
    assert.deepEqual(await messages(sibling), ['Duplicate translation key shared across global files']);
    assert.deepEqual(await messages(independent), []);
    assert.deepEqual(independent.translation.exported, { en: { shared: 'Three' }, de: { shared: 'Drei' } });

    await sibling.edit(2, '{"renamed":{"en":"Two","fr":"Deux"}}');
    assert.deepEqual(await messages(first), []);
    assert.deepEqual(await messages(sibling), []);
    assert.deepEqual(await messages(independent), []);

    await independent.edit(2, '{"shared":{"en":"Four","fr":"Quatre"}}');
    assert.deepEqual(await messages(independent), ['Locale not needed', 'Missing locales de']);
    assert.deepEqual(independent.translation.exported, { en: { shared: 'Four' }, de: {} });
    assert.deepEqual(await messages(first), []);
    assert.deepEqual(first.translation.exported, { en: { shared: 'One' }, fr: { shared: 'Un' } });

    await independent.edit(3, '{"shared":{"en":"Four","de":"Vier"}}');
    assert.deepEqual(await messages(independent), []);
    assert.deepEqual(independent.translation.exported, { en: { shared: 'Four' }, de: { shared: 'Vier' } });
    assert.deepEqual(await messages(sibling), []);
});
