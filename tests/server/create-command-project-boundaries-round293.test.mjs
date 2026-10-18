import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, normalize } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { ProjectManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts', 'tools.ts',
]);

test('create treats the config directory itself as a template location but excludes prefix siblings', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-create-boundary-'));
    const previous = [ProjectManager.getInstance, GenericServer.instance];
    t.after(() => {
        [ProjectManager.getInstance, GenericServer.instance] = previous;
        rmSync(root, { recursive: true, force: true });
    });

    const project = join(root, 'demo');
    const calls = [];
    ProjectManager.getInstance = () => ({
        getAllConfigFiles: () => [pathToUri(join(project, 'aventus.conf.avt'))],
    });
    GenericServer.instance = {
        isIDE: true,
        _localTemplate: { createTemplate: async path => calls.push(['template', path]) },
        _localProject: { createGlobal: async path => calls.push(['project', path]) },
    };

    const command = Commands.allCommandes['aventus.create'];
    await command.run(pathToUri(project));
    await command.run(pathToUri(join(project, 'nested', 'src')));
    await command.run(pathToUri(join(root, 'demo-copy')));
    await command.run(pathToUri(join(root, 'other')));

    assert.deepEqual(calls.map(([kind, path]) => [kind, path.toLowerCase()]), [
        ['template', normalize(project)],
        ['template', normalize(join(project, 'nested', 'src'))],
        ['project', normalize(join(root, 'demo-copy'))],
        ['project', normalize(join(root, 'other'))],
    ].map(([kind, path]) => [kind, path.toLowerCase()]));
});
