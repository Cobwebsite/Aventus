import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts',
]);

test('la recherche de clé i18n suit les décalages et le renommage après trois éditions', async t => {
    const uri = 'file:///D:/round192/keys.i18n.avt';
    const versions = [
        '{"first":{"en":"One"},"target":{"en":"Two"}}',
        '{"long-preface":{"en":"Before"},"target":{"en":"Two"}}',
        '{"long-preface":{"en":"Before"},"renamed":{"en":"Three"}}',
    ];
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, versions[0]));
    const build = {
        buildConfig: { i18n: { locales: ['en'], fallback: 'en' } },
        tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, true, build);
    t.after(async () => {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    });

    for (let index = 0; index < versions.length; index++) {
        if (index > 0) {
            await source.triggerContentChange(TextDocument.create(uri, 'json', index + 1, versions[index]));
        }
        const content = versions[index];
        const key = index === 2 ? 'renamed' : 'target';
        const keyOffset = content.indexOf(`"${key}"`) + 1;
        const valueOffset = content.indexOf(index === 2 ? 'Three' : 'Two');
        const span = (start, end) => [source.documentUser.positionAt(start), source.documentUser.positionAt(end)];
        assert.equal(translation.getKeyFromLocation(span(keyOffset, keyOffset + key.length)), key);
        assert.equal(translation.getKeyFromLocation(span(valueOffset, valueOffset + 2)), null);
        assert.equal(translation.exported.en[key], index === 2 ? 'Three' : 'Two');
        assert.deepEqual(await source.validate(false), []);
    }
    assert.equal(translation.getKeyFromLocation([
        source.documentUser.positionAt(versions[2].indexOf('renamed') + 1),
        source.documentUser.positionAt(versions[2].indexOf('renamed') + 4),
    ]), 'renamed');
    assert.equal(Object.hasOwn(translation.exported.en, 'target'), false);
});
