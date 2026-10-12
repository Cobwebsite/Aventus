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

test('an older in-flight validation can overwrite a newer published diagnostic', async () => {
    const previous = [GenericServer.instance, SettingsManager.instance];
    const events = [];
    const file = new InternalAventusFile(document(1, 'old'));
    const oldStarted = deferred();
    const releaseOld = deferred();
    GenericServer.instance = { connection: { sendDiagnostics: params => events.push(params) } };
    SettingsManager.instance = { settings: { errorByBuild: false } };
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
        assert.deepEqual(events.map(event => event.diagnostics[0].message), ['new']);
        releaseOld.resolve();
        assert.deepEqual(await oldValidation, [diagnostic('old')]);
        assert.deepEqual(events.map(event => event.diagnostics[0].message), ['new', 'old']);
    } finally {
        releaseOld.resolve();
        clearTimeout(file.delayValidate);
        [GenericServer.instance, SettingsManager.instance] = previous;
    }
});
