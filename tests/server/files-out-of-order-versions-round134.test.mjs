import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { GenericServer }] = await loadServerModules([
    'files/AventusFile.ts', 'GenericServer.ts',
]);

test('a delayed older document version cannot replace a newer in-memory revision', async () => {
    const uri = 'file:///workspace/versioned.wcl.avt';
    const document = (version, content) => TextDocument.create(uri, 'typescript', version, content);
    const file = new InternalAventusFile(document(1, 'initial'));
    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 99 };
    const changes = [];
    file.onContentChange(async current => changes.push([current.versionUser, current.contentUser]));
    try {
        await file.triggerContentChange(document(3, 'newest'));
        assert.equal(file.contentUser, 'newest');
        await file.triggerContentChange(document(2, 'delayed old content'));
        await file.triggerContentChange(document(3, 'duplicate'));
        assert.deepEqual(changes, [[3, 'newest']]);
        assert.equal(file.versionUser, 3);
        assert.equal(file.contentUser, 'newest');
    } finally {
        clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
    }
});

test('an older queued change resolves without replacing a newer queued version', async () => {
    const uri = 'file:///workspace/queued-versioned.wcl.avt';
    const document = (version, content) => TextDocument.create(uri, 'typescript', version, content);
    const file = new InternalAventusFile(document(1, 'initial'));
    const previousServer = GenericServer.instance;
    GenericServer.instance = { logLevel: 99 };
    const changes = [];
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let entered;
    const started = new Promise(resolve => { entered = resolve; });
    file.onContentChange(async current => {
        changes.push([current.versionUser, current.contentUser]);
        if (current.versionUser === 2) {
            entered();
            await gate;
        }
    });
    try {
        const first = file.triggerContentChange(document(2, 'first'));
        await started;
        const newest = file.triggerContentChange(document(4, 'newest'));
        const stale = file.triggerContentChange(document(3, 'stale'));
        await new Promise(resolve => setTimeout(resolve, 0));
        release();
        await Promise.all([first, newest, stale]);
        assert.deepEqual(changes, [[2, 'first'], [4, 'newest']]);
        assert.equal(file.versionUser, 4);
        assert.equal(file.contentUser, 'newest');
    } finally {
        release();
        clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
    }
});
