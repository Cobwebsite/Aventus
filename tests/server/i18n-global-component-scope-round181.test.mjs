import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }, { AventusWebComponentLogicalFile }] = await loadServerModules([
    'files/AventusFile.ts', 'language-services/i18n/File.ts', 'language-services/ts/component/File.ts',
]);

test('les clés identiques restent isolées entre traductions globales et composants après éditions', async t => {
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        module: 'Demo', tsFiles: {}, tsLanguageService: { i18nFiles: {} },
        diagnostics: new Map(), build() {},
    };
    const entries = [];
    const create = (name, isGlobal, text, className) => {
        const uri = `file:///D:/round181/${name}.i18n.avt`;
        const source = new InternalAventusFile(TextDocument.create(uri, 'json', 1, text));
        if (className) {
            const component = Object.create(AventusWebComponentLogicalFile.prototype);
            component._file = { isDeleted: false };
            component._componentClassName = className;
            component.fileParsed = { classes: { [className]: { fullName: `Widgets.${className}` } } };
            build.tsFiles[uri.replace('.i18n.avt', '.wcl.avt')] = component;
        }
        const translation = new AventusI18nFile(source, isGlobal, build);
        build.tsLanguageService.i18nFiles[uri] = translation;
        const item = { uri, source, translation, edit: (version, content) => source.triggerContentChange(TextDocument.create(uri, 'json', version, content)) };
        entries.push(item);
        return item;
    };
    t.after(async () => {
        for (const { source } of entries) {
            clearTimeout(source.delayValidate);
            await source.triggerDelete();
        }
    });
    const global = create('global', true, '{"title":{"en":"Global","fr":"Global fr"}}');
    const card = create('Card', false, '{"title":{"en":"Card"}}', 'Card');
    const panel = create('Panel', false, '{"title":{"en":"Panel","fr":"Panneau"}}', 'Panel');
    const diagnostics = async item => (await item.source.validate(false)).map(d => [d.message, item.source.documentUser.getText(d.range)]);

    assert.deepEqual(await diagnostics(global), []);
    assert.deepEqual(await diagnostics(card), [['Missing locales fr', '"title"']]);
    assert.deepEqual(await diagnostics(panel), []);
    assert.deepEqual(card.translation.exported, { en: { 'Demo°Widgets°Card°title': 'Card' }, fr: {} });
    assert.deepEqual(panel.translation.exported.fr, { 'Demo°Widgets°Panel°title': 'Panneau' });
    const range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
    const actions = await card.source.getCodeAction(range);
    assert.equal(actions.length, 1);
    assert.deepEqual(JSON.parse(actions[0].edit.changes[card.uri][0].newText), { title: { en: 'Card', fr: 'ⵌⵌ' } });

    await card.edit(2, '{"title":{"en":"Card","fr":"Carte"}}');
    await global.edit(2, '{"caption":{"en":"Caption","fr":"Légende"}}');
    assert.deepEqual(await diagnostics(card), []);
    assert.deepEqual(await diagnostics(global), []);
    assert.deepEqual(await diagnostics(panel), []);
    assert.deepEqual(await card.source.getCodeAction(range), []);
    assert.deepEqual(global.translation.exported.en, { caption: 'Caption' });
    assert.deepEqual(card.translation.exported.fr, { 'Demo°Widgets°Card°title': 'Carte' });
    assert.deepEqual(panel.translation.exported.en, { 'Demo°Widgets°Panel°title': 'Panel' });
});
