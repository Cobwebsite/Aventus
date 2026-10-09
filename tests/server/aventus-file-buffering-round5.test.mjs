import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'files/AventusFile.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

function document(version, text) {
    return TextDocument.create('file:///d%3A/app/buffer.wcl.avt', 'typescript', version, text);
}

async function until(predicate) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (predicate()) return;
        await new Promise(resolve => setTimeout(resolve, 1));
    }
    assert.fail('content change callback was not invoked');
}

test('content changes received during an async parse are coalesced to the latest document', async () => {
    const file = new InternalAventusFile(document(1, 'first'));
    const firstParse = deferred();
    const seen = [];
    file.onContentChange(async current => {
        seen.push([current.versionUser, current.contentUser]);
        if (current.versionUser === 2) await firstParse.promise;
    });
    try {
        const first = file.triggerContentChange(document(2, 'second'));
        await until(() => seen.length === 1);
        const middle = file.triggerContentChange(document(3, 'third'));
        const latest = file.triggerContentChange(document(4, 'fourth'));
        await new Promise(resolve => setTimeout(resolve, 5));
        assert.deepEqual(seen, [[2, 'second']]);
        firstParse.resolve();
        await Promise.all([first, middle, latest]);
        assert.deepEqual(seen, [[2, 'second'], [4, 'fourth']]);
        assert.equal(file.versionUser, 4);
        assert.equal(file.contentInternal, 'fourth');
    } finally {
        firstParse.resolve();
        clearTimeout(file.delayValidate);
    }
});

test('unlinking internal content keeps generated document stable across user changes', async () => {
    const file = new InternalAventusFile(document(1, 'first'));
    file.setDocumentInternal(document(9, 'generated'));
    file.linkInternalAndUser = false;
    try {
        await file.triggerContentChange(document(2, 'second'));
        assert.equal(file.versionUser, 2);
        assert.equal(file.contentUser, 'second');
        assert.equal(file.versionInternal, 9);
        assert.equal(file.contentInternal, 'generated');
    } finally {
        clearTimeout(file.delayValidate);
    }
});

test('deleting a changed file still runs its pending validation timer', async () => {
    const file = new InternalAventusFile(document(1, 'first'));
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    const sent = [];
    let validated = 0;
    GenericServer.instance = { connection: { sendDiagnostics: params => sent.push(params) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    file.onValidate(async () => {
        validated++;
        return [{ message: 'stale', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } } }];
    });
    try {
        await file.triggerContentChange(document(2, 'second'));
        await file.triggerDelete();
        await new Promise(resolve => setTimeout(resolve, 560));
        assert.equal(validated, 1);
        assert.equal(sent.length, 1);
        assert.equal(sent[0].diagnostics[0].message, 'stale');
    } finally {
        clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
    }
});

test('rapid consecutive changes postpone validation until the latest content', async () => {
    const file = new InternalAventusFile(document(1, 'first'));
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    const sent = [];
    const validated = [];
    GenericServer.instance = { connection: { sendDiagnostics: params => sent.push(params) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    file.onValidate(async current => {
        validated.push(current.contentUser);
        return [];
    });
    try {
        await file.triggerContentChange(document(2, 'second'));
        await new Promise(resolve => setTimeout(resolve, 50));
        await file.triggerContentChange(document(3, 'third'));
        assert.deepEqual(validated, []);
        await new Promise(resolve => setTimeout(resolve, 550));
        assert.deepEqual(validated, ['third']);
        assert.deepEqual(sent, [{ uri: file.uri, diagnostics: [] }]);
    } finally {
        clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        SettingsManager.instance = previousSettings;
    }
});
