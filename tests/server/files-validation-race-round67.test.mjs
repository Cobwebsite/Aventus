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

const uri = 'file:///round67/validation.wcl.avt';
const document = (version, content) => TextDocument.create(uri, 'typescript', version, content);
const diagnostic = message => ({ message, range: {
    start: { line: 0, character: 0 }, end: { line: 0, character: 1 },
} });

test('deferred validation publishes the latest edited content to each associated build', async () => {
    const previous = [GenericServer.instance, SettingsManager.instance];
    const events = [];
    const file = new InternalAventusFile(document(1, 'first'));
    const builds = [{ buildConfig: { fullname: 'Demo@web' } }, { buildConfig: { fullname: 'Demo@mobile' } }];
    const observed = [];
    GenericServer.instance = { connection: { sendDiagnostics: (params, build) => events.push([params, build]) } };
    SettingsManager.instance = { settings: { errorByBuild: true } };
    file.onGetBuild(() => builds);
    file.onValidate(async current => {
        observed.push(current.contentUser);
        return [diagnostic(current.contentUser)];
    });
    try {
        await file.triggerContentChange(document(2, 'intermediate'));
        await file.triggerContentChange(document(3, 'latest'));
        assert.deepEqual(observed, []);
        await new Promise(resolve => setTimeout(resolve, 550));
        assert.deepEqual(observed, ['latest']);
        assert.deepEqual(events, builds.map(build => [{ uri, diagnostics: [diagnostic('latest')] }, build.buildConfig.fullname]));
    } finally {
        clearTimeout(file.delayValidate);
        [GenericServer.instance, SettingsManager.instance] = previous;
    }
});

test('an older in-flight validation does not overwrite a newer published diagnostic', async () => {
    const previous = [GenericServer.instance, SettingsManager.instance];
    const events = [];
    const file = new InternalAventusFile(document(1, 'old'));
    const oldStarted = deferred();
    const releaseOld = deferred();
    const builds = [{ buildConfig: { fullname: 'Demo@web' } }, { buildConfig: { fullname: 'Demo@mobile' } }];
    GenericServer.instance = { connection: { sendDiagnostics: (params, build) => events.push([params, build]) } };
    SettingsManager.instance = { settings: { errorByBuild: true } };
    file.onGetBuild(() => builds);
    file.onValidate(async current => {
        const content = current.contentUser;
        if (content === 'old') {
            oldStarted.resolve();
            await releaseOld.promise;
        }
        return [diagnostic(content)];
    });
    try {
        const oldValidation = file.validate();
        await oldStarted.promise;
        await file.triggerContentChange(document(2, 'new'));
        assert.deepEqual(await file.validate(), [diagnostic('new')]);
        assert.deepEqual(events.map(([event, build]) => [event.diagnostics[0].message, build]), [['new', 'Demo@web'], ['new', 'Demo@mobile']]);
        releaseOld.resolve();
        assert.deepEqual(await oldValidation, []);
        assert.deepEqual(events.map(([event, build]) => [event.diagnostics[0].message, build]), [['new', 'Demo@web'], ['new', 'Demo@mobile']]);
    } finally {
        releaseOld.resolve();
        clearTimeout(file.delayValidate);
        [GenericServer.instance, SettingsManager.instance] = previous;
    }
});

test('validation publishes diagnostics when compilation changes the internal document version', async () => {
    const previous = [GenericServer.instance, SettingsManager.instance];
    const events = [];
    const file = new InternalAventusFile(document(1, 'logic'));
    GenericServer.instance = { connection: { sendDiagnostics: params => events.push(params) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    file.onValidate(async current => {
        current.setDocumentInternal(document(2, 'generated from view'));
        return [diagnostic('view error')];
    });
    try {
        assert.deepEqual(await file.validate(), [diagnostic('view error')]);
        assert.deepEqual(events, [{ uri, diagnostics: [diagnostic('view error')] }]);
    } finally {
        [GenericServer.instance, SettingsManager.instance] = previous;
    }
});

test('a newer validation supersedes an older one without a user document change', async () => {
    const previous = [GenericServer.instance, SettingsManager.instance];
    const events = [];
    const file = new InternalAventusFile(document(1, 'logic'));
    const oldStarted = deferred();
    const releaseOld = deferred();
    let calls = 0;
    GenericServer.instance = { connection: { sendDiagnostics: params => events.push(params) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    file.onValidate(async current => {
        const call = ++calls;
        if (call === 1) {
            oldStarted.resolve();
            await releaseOld.promise;
        } else {
            current.setDocumentInternal(document(2, 'new generated view'));
        }
        return [diagnostic(call === 1 ? 'old view' : 'new view')];
    });
    try {
        const oldValidation = file.validate();
        await oldStarted.promise;
        assert.deepEqual(await file.validate(), [diagnostic('new view')]);
        releaseOld.resolve();
        assert.deepEqual(await oldValidation, []);
        assert.deepEqual(events, [{ uri, diagnostics: [diagnostic('new view')] }]);
    } finally {
        releaseOld.resolve();
        [GenericServer.instance, SettingsManager.instance] = previous;
    }
});

test('closing a file prevents an in-flight validation from publishing', async () => {
    const previous = [GenericServer.instance, SettingsManager.instance];
    const events = [];
    const file = new InternalAventusFile(document(1, 'closing'));
    const started = deferred();
    const release = deferred();
    GenericServer.instance = { connection: { sendDiagnostics: params => events.push(params) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
    file.onValidate(async () => {
        started.resolve();
        await release.promise;
        return [diagnostic('closing')];
    });
    try {
        const validation = file.validate();
        await started.promise;
        await file.triggerDelete();
        release.resolve();
        assert.deepEqual(await validation, []);
        assert.deepEqual(events, []);
    } finally {
        release.resolve();
        [GenericServer.instance, SettingsManager.instance] = previous;
    }
});
