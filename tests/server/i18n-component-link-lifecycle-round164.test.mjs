import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts', 'language-services/ts/component/File.ts',
]);

test('une traduction de composant suit l’apparition, le changement puis la suppression de la classe liée', async t => {
    const uri = 'file:///D:/round164/Card.i18n.avt';
    const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, '{"title":{"en":"Title","fr":"Titre"}}'));
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        module: 'Demo', tsFiles: {}, tsLanguageService: { i18nFiles: {} }, diagnostics: new Map(), build() {},
    };
    const translation = new AventusI18nFile(source, false, build);
    t.after(async () => { clearTimeout(source.delayValidate); await source.triggerDelete(); });
    assert.deepEqual(translation.exported, { en: {}, fr: {} });
    assert.ok((await source.validate(false)).some(item => item.message.includes('No matching component')));

    const component = Object.create(AventusWebComponentLogicalFile.prototype);
    component._file = { isDeleted: false };
    component._componentClassName = 'Card';
    component.fileParsed = { classes: { Card: { fullName: 'Widgets.Card' } } };
    build.tsFiles[uri.replace('.i18n.avt', '.wcl.avt')] = component;
    translation.transformForExport();
    assert.deepEqual(translation.exported, {
        en: { 'Demo°Widgets°Card°title': 'Title' }, fr: { 'Demo°Widgets°Card°title': 'Titre' },
    });
    assert.equal((await source.validate(false)).some(item => item.message.includes('No matching component')), false);

    component.fileParsed = { classes: { Card: { fullName: 'Widgets.RenamedCard' } } };
    await source.triggerContentChange(TextDocument.create(uri, 'json', 2, '{"caption":{"en":"Caption","fr":"Légende"}}'));
    assert.deepEqual(translation.exported, {
        en: { 'Demo°Widgets°RenamedCard°caption': 'Caption' },
        fr: { 'Demo°Widgets°RenamedCard°caption': 'Légende' },
    });
    component._file.isDeleted = true;
    translation.transformForExport();
    assert.deepEqual(translation.exported, { en: {}, fr: {} });
    assert.ok((await source.validate(false)).some(item => item.message.includes('No matching component')));
});
