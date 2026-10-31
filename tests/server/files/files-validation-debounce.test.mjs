import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ InternalAventusFile }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'files/AventusFile.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

const uri = 'file:///round90/debounce.wcl.avt';
const document = (version, content) => TextDocument.create(uri, 'typescript', version, content);
const diagnostic = message => ({ message, range: {
    start: { line: 0, character: 0 }, end: { line: 0, character: 1 },
} });

async function until(predicate) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (predicate()) return;
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.fail('delayed diagnostic was not published');
}

test('successive delayed validations replace an error, clear it after a rapid repair, then publish the next error', async () => {
    const previous = [GenericServer.instance, SettingsManager.instance];
    const publications = [];
    const validated = [];
    const file = new InternalAventusFile(document(1, 'broken-one'));
    GenericServer.instance = { connection: { sendDiagnostics: params => publications.push(params) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    file.onValidate(async current => {
        validated.push([current.versionUser, current.contentUser]);
        return current.contentUser.startsWith('broken') ? [diagnostic(current.contentUser)] : [];
    });
    try {
        await file.triggerContentChange(document(2, 'broken-two'));
        await until(() => publications.length === 1);
        await file.triggerContentChange(document(3, 'broken-intermediate'));
        await file.triggerContentChange(document(4, 'repaired'));
        await until(() => publications.length === 2);
        await file.triggerContentChange(document(5, 'broken-three'));
        await until(() => publications.length === 3);
        assert.deepEqual(validated, [
            [2, 'broken-two'], [4, 'repaired'], [5, 'broken-three'],
        ]);
        assert.deepEqual(publications, [
            { uri, diagnostics: [diagnostic('broken-two')] },
            { uri, diagnostics: [] },
            { uri, diagnostics: [diagnostic('broken-three')] },
        ]);
    } finally {
        clearTimeout(file.delayValidate);
        [GenericServer.instance, SettingsManager.instance] = previous;
    }
});
