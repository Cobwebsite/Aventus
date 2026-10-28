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
        getAllStatics: () => [{ name: 'site', uri: 'file:///project', index: 0 }, { name: 'docs', uri: 'file:///docs', index: 0 }],
        getProjectByUri: uri => {
            seen.push(['project', uri]);
            return { getStaticAt: index => { seen.push(['static', index]); return { export: async () => seen.push(['export']) }; } };
        },
    });
    GenericServer.Select = async (items, options) => {
        seen.push(['select', items, options]);
        return { label: 'docs', detail: 'file:///docs', id: '0' };
    };
    try {
        await StaticExport.run();
        assert.deepEqual(seen, [
            ['select', [
                { label: 'site', detail: 'file:///project', id: '0' },
                { label: 'docs', detail: 'file:///docs', id: '0' },
            ], { title: 'Static to export' }],
            ['project', 'file:///docs'], ['static', 0], ['export'],
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
        getAllStatics: () => [{ name: 'docs', uri: 'file:///docs', index: 0 }],
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

test('static export distinguishes unnamed and same-named outputs by project index', async () => {
    const originalInstance = ProjectManager.getInstance;
    const originalSelect = GenericServer.Select;
    const manager = Object.create(ProjectManager.prototype);
    const uri = 'file:///project';
    const exported = [];
    const project = {
        getConfigFile: () => ({ uri }),
        getStaticsName: () => ['', 'Assets', 'Assets'],
        getStaticAt: index => ({ export: async () => exported.push(index) }),
    };
    manager.projects = { [uri]: project };
    ProjectManager.getInstance = () => manager;
    assert.deepEqual(manager.getAllStatics(), [
        { uri, index: 0 },
        { name: 'Assets', uri, index: 1 },
        { name: 'Assets', uri, index: 2 },
    ]);
    GenericServer.Select = async items => {
        assert.deepEqual(items.map(item => [item.label, item.id]), [
            ['Static #0', '0'], ['Assets', '1'], ['Assets', '2'],
        ]);
        return items[2];
    };
    try {
        await StaticExport.run();
        assert.deepEqual(exported, [2]);
    } finally {
        ProjectManager.getInstance = originalInstance;
        GenericServer.Select = originalSelect;
    }
});
