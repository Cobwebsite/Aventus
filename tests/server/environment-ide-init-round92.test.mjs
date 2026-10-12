import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { GenericServer } = await loadServerModule('GenericServer.ts');

test('IDE initialization retains workspace/resource paths, resets the log and schedules the update check', t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-ide-init-'));
    const logFile = join(root, 'server.log');
    writeFileSync(logFile, 'previous session');
    const previous = GenericServer.instance;
    t.after(() => {
        GenericServer.instance = previous;
        rmSync(root, { recursive: true, force: true });
    });

    const server = Object.create(GenericServer.prototype);
    server.workspaces = [];
    let updateChecks = 0;
    server.runUpdate = () => { updateChecks++; };
    Object.defineProperty(server, 'logLevel', { value: 99 });
    GenericServer.instance = server;
    const params = {
        workspaceFolders: [{ uri: 'file:///first' }, { uri: 'file:///second' }],
        savePath: root,
        extensionPath: join(root, 'extension'),
        logFile,
        isIDE: true,
        noBuild: true,
    };
    server.onInitialize(params);

    assert.deepEqual(server.workspaces, ['file:///first', 'file:///second']);
    assert.equal(server.isIDE, true);
    assert.equal(server._extensionPath, params.extensionPath);
    assert.equal(server._savePath, root);
    assert.equal(server._noBuild, true);
    assert.equal(server._logFile, logFile);
    assert.equal(readFileSync(logFile, 'utf8'), '');
    assert.equal(updateChecks, 1);
});
