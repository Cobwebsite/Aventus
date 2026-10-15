import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, normalize } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { ProjectManager }, { GenericServer }, { pathToUri }] = await loadServerModules([
    'cmds/index.ts', 'project/ProjectManager.ts', 'GenericServer.ts', 'tools.ts',
]);

test('create resolves exact roots and normalized nested paths among multiple projects', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-create-multi-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const previousProject = ProjectManager.getInstance;
    const previousServer = GenericServer.instance;
    t.after(() => {
        ProjectManager.getInstance = previousProject;
        GenericServer.instance = previousServer;
    });

    const alpha = join(root, 'alpha');
    const beta = join(root, 'beta');
    const calls = [];
    ProjectManager.getInstance = () => ({
        getAllConfigFiles: () => [
            pathToUri(join(alpha, 'aventus.conf.avt')),
            pathToUri(join(beta, 'aventus.conf.avt')),
        ],
    });
    GenericServer.instance = {
        isIDE: true,
        _localTemplate: { createTemplate: async path => calls.push(['template', path]) },
        _localProject: { createGlobal: async path => calls.push(['project', path]) },
    };

    const command = Commands.allCommandes['aventus.create'];
    await command.run(pathToUri(alpha));
    await command.run(pathToUri(join(beta, 'src', '..', 'components')));
    await command.run(pathToUri(join(alpha, '..', 'alpha-extra')));
    await command.run(pathToUri(root));

    assert.deepEqual(calls.map(([kind, path]) => [kind, normalize(path).toLowerCase()]), [
        ['template', normalize(alpha).toLowerCase()],
        ['template', normalize(join(beta, 'components')).toLowerCase()],
        ['project', normalize(join(root, 'alpha-extra')).toLowerCase()],
        ['project', normalize(root).toLowerCase()],
    ]);
});
