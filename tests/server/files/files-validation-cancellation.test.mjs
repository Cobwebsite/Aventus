import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ InternalAventusFile }, { GenericServer }, { SettingsManager }] = await loadServerModules([
    'files/AventusFile.ts', 'GenericServer.ts', 'settings/Settings.ts',
]);

const uri = 'file:///round73/validation.wcl.avt';
const doc = (version, content) => TextDocument.create(uri, 'typescript', version, content);
const diagnostic = message => ({ message, range: {
    start: { line: 0, character: 0 }, end: { line: 0, character: 1 },
} });
const deferred = () => {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
};

test('removing a validation callback excludes it from subsequent validation', async () => {
    const previous = [GenericServer.instance, SettingsManager.instance];
    const sent = [];
    const file = new InternalAventusFile(doc(1, 'first'));
    GenericServer.instance = { connection: { sendDiagnostics: params => sent.push(params) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    let removedCalls = 0;
    file.onValidate(async () => [diagnostic('retained')]);
    const id = file.onValidate(async () => { removedCalls++; return [diagnostic('removed')]; });
    try {
        assert.deepEqual(await file.validate(false), [diagnostic('retained'), diagnostic('removed')]);
        file.removeOnValidate(id);
        assert.deepEqual(await file.validate(), [diagnostic('retained')]);
        assert.equal(removedCalls, 1);
        assert.deepEqual(sent, [{ uri, diagnostics: [diagnostic('retained')] }]);
    } finally {
        [GenericServer.instance, SettingsManager.instance] = previous;
    }
});

test('deleting during the first asynchronous validator prevents later callbacks and publication', async () => {
    const previous = [GenericServer.instance, SettingsManager.instance];
    const sent = [];
    const file = new InternalAventusFile(doc(1, 'first'));
    const started = deferred();
    const release = deferred();
    let laterCalls = 0;
    GenericServer.instance = { connection: { sendDiagnostics: params => sent.push(params) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    file.onValidate(async () => { started.resolve(); await release.promise; return [diagnostic('stale')]; });
    file.onValidate(async () => { laterCalls++; return [diagnostic('later')]; });
    try {
        const pending = file.validate();
        await started.promise;
        await file.triggerDelete();
        release.resolve();
        assert.deepEqual(await pending, []);
        assert.equal(laterCalls, 0);
        assert.deepEqual(sent, []);
    } finally {
        release.resolve();
        [GenericServer.instance, SettingsManager.instance] = previous;
    }
});

test('deleting before the delayed validation fires cancels its publication', async () => {
    const previous = [GenericServer.instance, SettingsManager.instance];
    const sent = [];
    const file = new InternalAventusFile(doc(1, 'first'));
    let calls = 0;
    GenericServer.instance = { connection: { sendDiagnostics: params => sent.push(params) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    file.onValidate(async () => { calls++; return [diagnostic('stale')]; });
    try {
        await file.triggerContentChange(doc(2, 'second'));
        await file.triggerDelete();
        await new Promise(resolve => setTimeout(resolve, 550));
        assert.equal(calls, 0);
        assert.deepEqual(sent, []);
        assert.deepEqual(await file.validate(), []);
    } finally {
        clearTimeout(file.delayValidate);
        [GenericServer.instance, SettingsManager.instance] = previous;
    }
});
