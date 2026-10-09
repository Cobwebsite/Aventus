import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }, { Build }] = await loadServerModules([
    'files/AventusFile.ts',
    'language-services/i18n/File.ts',
    'project/Build.ts',
]);

function fixture(t, entries) {
    const directory = mkdtempSync(join(import.meta.dirname, '.i18n-cross-files-round39-'));
    t.after(() => rmSync(directory, { recursive: true, force: true }));
    const written = new Map();
    const build = Object.create(Build.prototype);
    build.buildConfig = { i18n: { locales: ['en', 'fr'], fallback: 'en' } };
    build.tsFiles = {};
    build.i18nComponentsFiles = {};
    build.tsLanguageService = { i18nFiles: {} };
    build.diagnostics = new Map();
    build.build = () => {};
    build.writeFile = async (path, content) => written.set(path, JSON.parse(content));
    const files = entries.map(([name, content]) => {
        const uri = `file:///D:/round39/${name}.i18n.avt`;
        const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, content));
        const translation = new AventusI18nFile(source, true, build);
        build.tsLanguageService.i18nFiles[uri] = translation;
        return { source, translation, change: (version, text) => source.triggerContentChange(TextDocument.create(uri, 'json', version, text)) };
    });
    t.after(async () => {
        for (const { source } of files) {
            clearTimeout(source.delayValidate);
            await source.triggerDelete();
        }
    });
    return { build, directory, written, files };
}

test('les diagnostics et corrections de locales restent propres à chaque fichier i18n', async t => {
    const { files } = fixture(t, [
        ['@first', '{"shared":{"en":"First"},"onlyFirst":{"en":"One","fr":"Un"}}'],
        ['@second', '{"shared":{"en":"Second","fr":"Deux"},"onlySecond":{"fr":"Deux"}}'],
    ]);
    const [first, second] = files;
    const firstDiagnostics = await first.source.validate(false);
    const secondDiagnostics = await second.source.validate(false);
    assert.deepEqual(firstDiagnostics.map(item => item.message), ['Missing locales fr']);
    assert.deepEqual(secondDiagnostics.map(item => item.message), ['Missing locales en']);
    const firstActions = await first.source.getCodeAction(firstDiagnostics[0].range);
    const edit = firstActions.find(item => item.title === 'Import missing locales')?.edit.changes[first.source.uri][0];
    assert.ok(edit);
    assert.equal(firstActions.some(item => item.edit?.changes?.[second.source.uri]), false);
    await first.change(2, TextDocument.applyEdits(first.source.documentUser, [edit]));
    assert.deepEqual((await first.source.validate(false)).map(item => item.message), ['Translation not set']);
    assert.deepEqual((await second.source.validate(false)).map(item => item.message), ['Missing locales en']);
    assert.deepEqual(second.translation.exported.en, { shared: 'Second' });
});

test('un build i18n fusionne les fichiers réels puis suit modification et retrait', async t => {
    const { build, directory, written, files } = fixture(t, [
        ['@first', '{"shared":{"en":"First","fr":"Premier"},"first":{"en":"One","fr":"Un"}}'],
        ['@second', '{"shared":{"en":"Second","fr":"Deux"},"second":{"en":"Two","fr":"Deux"}}'],
    ]);
    const output = [{ mode: 'singleFile', output: [directory] }];
    const enPath = join(directory, 'en.json').toLowerCase();
    const frPath = join(directory, 'fr.json').toLowerCase();
    await build.writeBuildI18n(output);
    assert.deepEqual(written.get(enPath), { shared: 'Second', first: 'One', second: 'Two' });
    assert.deepEqual(written.get(frPath), { shared: 'Deux', first: 'Un', second: 'Deux' });

    await files[1].change(2, '{"second":{"en":"Updated","fr":"Modifié"}}');
    await build.writeBuildI18n(output);
    assert.deepEqual(written.get(enPath), { shared: 'First', first: 'One', second: 'Updated' });
    assert.deepEqual(written.get(frPath), { shared: 'Premier', first: 'Un', second: 'Modifié' });

    delete build.tsLanguageService.i18nFiles[files[0].source.uri];
    await build.writeBuildI18n(output);
    assert.deepEqual(written.get(enPath), { second: 'Updated' });
    assert.deepEqual(written.get(frPath), { second: 'Modifié' });
});

test('les modes séparés exportent chaque fichier i18n réel selon sa locale', async t => {
    const { build, directory, written } = fixture(t, [
        ['@first', '{"same":{"en":"One","fr":"Un"}}'],
        ['@second', '{"same":{"en":"Two","fr":"Deux"}}'],
    ]);
    await build.writeBuildI18n([{ mode: 'oneToOne', output: [directory] }]);
    assert.deepEqual(written.get(join(directory, 'first_en.json').toLowerCase()), { same: 'One' });
    assert.deepEqual(written.get(join(directory, 'first_fr.json').toLowerCase()), { same: 'Un' });
    assert.deepEqual(written.get(join(directory, 'second_en.json').toLowerCase()), { same: 'Two' });
    assert.deepEqual(written.get(join(directory, 'second_fr.json').toLowerCase()), { same: 'Deux' });
    assert.equal(written.size, 4);
});
