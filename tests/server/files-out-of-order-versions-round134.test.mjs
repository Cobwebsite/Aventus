import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ InternalAventusFile }, { GenericServer }] = await loadServerModules([
    'files/AventusFile.ts', 'GenericServer.ts',
]);

test('a delayed older document version replaces a newer in-memory revision', async () => {
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
        assert.deepEqual(changes, [[3, 'newest'], [2, 'delayed old content']]);
        assert.equal(file.versionUser, 2);
        assert.equal(file.contentUser, 'delayed old content');
    } finally {
        clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
    }
});
