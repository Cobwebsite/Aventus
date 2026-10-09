import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { AventusI18nFile }] = await loadServerModules([
    'files/AventusFile.ts',
    'language-services/i18n/File.ts',
]);

function fixture(content) {
    const uri = 'file:///D:/round26/messages.i18n.avt';
    const document = TextDocument.create(uri, 'json', 1, content);
    const source = new InternalAventusFile(document);
    const builds = [];
    const build = {
        buildConfig: { i18n: { locales: ['en', 'fr'], fallback: 'en' } },
        module: 'Round26',
        tsFiles: {},
        diagnostics: new Map(),
        hideWarnings: false,
        build() { builds.push(true); },
    };
    const translation = new AventusI18nFile(source, true, build);
    const change = (version, text) => source.triggerContentChange(TextDocument.create(uri, 'json', version, text));
    return { source, translation, builds, change };
}

test('i18n file updates diagnostics, generated declarations and locale exports across edits', async () => {
    const { source, translation, change } = fixture('{"greeting":{"en":"Hello"}}');
    try {
        assert.deepEqual(translation.exported, { en: { greeting: 'Hello' }, fr: {} });
        assert.match(source.contentInternal, /"greeting": string/);
        assert.deepEqual((await source.validate(false)).map(item => item.message), ['Missing locales fr']);

        await change(2, '{"farewell":{"en":"Bye","fr":"Salut"}}');
        assert.deepEqual(translation.keys, ['farewell']);
        assert.deepEqual(translation.exported, { en: { farewell: 'Bye' }, fr: { farewell: 'Salut' } });
        assert.match(source.contentInternal, /"farewell": string/);
        assert.doesNotMatch(source.contentInternal, /"greeting": string/);
        assert.deepEqual(await source.validate(false), []);
    } finally {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    }
});

test('i18n code action fills a missing locale and the applied edit clears its diagnostic', async () => {
    const { source, translation, change } = fixture('{"complete":{"en":"Hello","fr":"Bonjour"},"partial":{"en":"Hi"}}');
    try {
        const diagnostic = await source.validate(false);
        assert.deepEqual(diagnostic.map(item => item.message), ['Missing locales fr']);
        const actions = await source.getCodeAction(diagnostic[0].range);
        const importAction = actions.find(item => item.title === 'Import missing locales');
        assert.ok(importAction);
        const edit = importAction.edit.changes[source.uri][0];
        const updated = TextDocument.applyEdits(source.documentUser, [edit]);
        assert.deepEqual(JSON.parse(updated).complete, { en: 'Hello', fr: 'Bonjour' });
        assert.deepEqual(JSON.parse(updated).partial, { en: 'Hi', fr: 'ⵌⵌ' });

        await change(2, updated);
        assert.deepEqual(translation.exported.fr, { complete: 'Bonjour', partial: 'ⵌⵌ' });
        assert.deepEqual((await source.validate(false)).map(item => item.message), ['Translation not set']);
    } finally {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    }
});

test('i18n file recovers parsed keys and exports after malformed intermediate JSON', async () => {
    const { source, translation, change } = fixture('{"before":{"en":"First","fr":"Premier"}}');
    try {
        await change(2, '{"before":{"en":');
        assert.ok((await source.validate(false)).length > 0);
        await change(3, '{"after":{"en":"Last","fr":"Dernier"}}');
        assert.deepEqual(await source.validate(false), []);
        assert.deepEqual(translation.keys, ['after']);
        assert.deepEqual(translation.exported, { en: { after: 'Last' }, fr: { after: 'Dernier' } });
        assert.match(source.contentInternal, /"after": string/);
        assert.doesNotMatch(source.contentInternal, /"before": string/);
    } finally {
        clearTimeout(source.delayValidate);
        await source.triggerDelete();
    }
});

test('i18n save and deletion delegate a rebuild and remove registered document callbacks', async () => {
    const { source, builds } = fixture('{"hello":{"en":"Hello","fr":"Bonjour"}}');
    await source.triggerSave();
    assert.equal(builds.length, 1);
    await source.triggerDelete();
    assert.equal(builds.length, 2);
    assert.deepEqual(await source.validate(false), []);
    assert.deepEqual((await source.getCompletion({ line: 0, character: 2 })).items, []);
});
