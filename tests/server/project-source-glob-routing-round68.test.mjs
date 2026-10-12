import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusJSONLanguageService }, { SettingsManager }, { GenericServer },
    { Project }, { ProjectManager }, { Build }] = await loadServerModules([
    'language-services/json/LanguageService.ts', 'settings/Settings.ts', 'GenericServer.ts',
    'project/Project.ts', 'project/ProjectManager.ts', 'project/Build.ts',
]);

test('prepared source globs route exact files and shared folders to their owning builds', async () => {
    const previous = { settings: SettingsManager.instance, server: GenericServer.instance };
    SettingsManager.instance = { settings: { defaultHideWarnings: false } };
    GenericServer.instance = { workspaces: ['file:///D:/round68'], logLevel: 4 };
    try {
        const service = AventusJSONLanguageService.getInstance();
        const configs = [
            ['alpha', { module: 'Alpha', build: [{ name: 'web', src: ['./src/entry.lib.avt', '../shared'] }] }],
            ['beta', { module: 'Beta', build: [{ name: 'web', src: ['./src', '../shared'] }] }],
        ];
        const manager = Object.create(ProjectManager.prototype);
        manager.projects = {};
        for (const [folder, value] of configs) {
            const uri = `file:///D:/round68/${folder}/aventus.conf.avt`;
            const prepared = await service.getConfig(TextDocument.create(uri, 'json', 1, JSON.stringify(value)));
            assert.ok(prepared, folder);
            const project = Object.create(Project.prototype);
            project.builds = prepared.build.map(buildConfig => {
                const build = Object.create(Build.prototype);
                build.buildConfig = buildConfig;
                return build;
            });
            manager.projects[uri] = project;
        }
        const owners = path => manager.getMatchingBuildsByUri(`file:///D:/round68/${path}`)
            .map(build => build.buildConfig.fullname);
        assert.deepEqual(owners('alpha/src/entry.lib.avt'), ['Alpha@web']);
        assert.deepEqual(owners('alpha/src/entry.lib.avt.bak'), []);
        assert.deepEqual(owners('alpha/src/entryXlibXavt'), []);
        assert.deepEqual(owners('alpha/src/other.lib.avt'), []);
        assert.deepEqual(owners('beta/src/other.lib.avt'), ['Beta@web']);
        assert.deepEqual(owners('beta/src-neighbor/other.lib.avt'), []);
        assert.deepEqual(owners('shared/item.wcl.avt'), ['Alpha@web', 'Beta@web']);
        assert.deepEqual(owners('shared-neighbor/item.wcl.avt'), []);
    } finally {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
    }
});
