import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [, { StaticExport }, { ProjectManager }, { GenericServer }] = await loadServerModules([
    'cmds/index.ts', 'cmds/StaticExport.ts', 'project/ProjectManager.ts', 'GenericServer.ts',
]);

test('static export offers all builds and exports the selected project output', async () => {
    const originalInstance = ProjectManager.getInstance;
    const originalSelect = GenericServer.Select;
    const seen = [];
    ProjectManager.getInstance = () => ({
        getAllStatics: () => [{ name: 'site', uri: 'file:///project' }, { name: 'docs', uri: 'file:///docs' }],
        getProjectByUri: uri => {
            seen.push(['project', uri]);
            return { getStatic: name => { seen.push(['static', name]); return { export: async () => seen.push(['export']) }; } };
        },
    });
    GenericServer.Select = async (items, options) => {
        seen.push(['select', items, options]);
        return { label: 'docs', detail: 'file:///docs' };
    };
    try {
        await StaticExport.run();
        assert.deepEqual(seen, [
            ['select', [
                { label: 'site', detail: 'file:///project' },
                { label: 'docs', detail: 'file:///docs' },
            ], { title: 'Static to export' }],
            ['project', 'file:///docs'], ['static', 'docs'], ['export'],
        ]);
    } finally {
        ProjectManager.getInstance = originalInstance;
        GenericServer.Select = originalSelect;
    }
});

test('static export stops when selection is cancelled', async () => {
    const originalInstance = ProjectManager.getInstance;
    const originalSelect = GenericServer.Select;
    let projectLookups = 0;
    ProjectManager.getInstance = () => ({
        getAllStatics: () => [],
        getProjectByUri: () => { projectLookups++; },
    });
    GenericServer.Select = async () => undefined;
    try {
        await StaticExport.run();
        assert.equal(projectLookups, 0);
    } finally {
        ProjectManager.getInstance = originalInstance;
        GenericServer.Select = originalSelect;
    }
});
