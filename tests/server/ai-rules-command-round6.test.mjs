import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GenericServer }, { pathToUri }, { Rules }] = await loadServerModules([
    'GenericServer.ts', 'tools.ts', 'cmds/ai/Rules.ts',
]);

test('AI rules command creates the workspace directory and copies the extension rules', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-ai-rules-'));
    const previous = GenericServer.instance;
    const extension = join(root, 'extension');
    const workspace = join(root, 'workspace');
    mkdirSync(join(extension, 'lib'), { recursive: true });
    mkdirSync(workspace);
    writeFileSync(join(extension, 'lib', 'aventusjs-rules.md'), '# Aventus rules');
    GenericServer.instance = { _extensionPath: extension, workspaces: [pathToUri(workspace)] };
    try {
        assert.equal(Rules.cmd, 'aventus.ai.rules');
        await Rules.run();
        const destination = join(workspace, '.aventus', 'aventusjs-rules.md');
        assert.equal(existsSync(destination), true);
        assert.equal(readFileSync(destination, 'utf8'), '# Aventus rules');
        writeFileSync(destination, 'outdated');
        await Rules.run();
        assert.equal(readFileSync(destination, 'utf8'), '# Aventus rules');
    } finally {
        GenericServer.instance = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
