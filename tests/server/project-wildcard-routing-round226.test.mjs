import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ AventusJSONLanguageService }, { SettingsManager }, { GenericServer },
    { Project }, { ProjectManager }, { Build }] = await loadServerModules([
    'language-services/json/LanguageService.ts', 'settings/Settings.ts', 'GenericServer.ts',
    'project/Project.ts', 'project/ProjectManager.ts', 'project/Build.ts',
]);

test('two projects reroute wildcard and exact sources after independent config revisions', async t => {
    const previous = { settings: SettingsManager.instance, server: GenericServer.instance };
    SettingsManager.instance = { settings: { defaultHideWarnings: false } };
    GenericServer.instance = { workspaces: ['file:///D:/round226'], logLevel: 4 };
    t.after(() => {
        SettingsManager.instance = previous.settings;
        GenericServer.instance = previous.server;
    });

    const service = AventusJSONLanguageService.getInstance();
    const manager = Object.create(ProjectManager.prototype);
    manager.projects = {};
    const save = async (name, version, src) => {
        const uri = `file:///D:/round226/${name}/aventus.conf.avt`;
        const prepared = await service.getConfig(TextDocument.create(uri, 'json', version,
            JSON.stringify({ module: name, build: [{ name: 'web', src }] })));
        assert.ok(prepared, name);
        const project = Object.create(Project.prototype);
        project.builds = prepared.build.map(buildConfig => {
            const build = Object.create(Build.prototype);
            build.buildConfig = buildConfig;
            return build;
        });
        manager.projects[uri] = project;
    };
    const owners = path => manager.getMatchingBuildsByUri(`file:///D:/round226/${path}`)
        .map(build => build.buildConfig.fullname);

    await save('alpha', 1, ['./src/*/entry.lib.avt']);
    await save('beta', 1, ['../alpha/src/one/entry.lib.avt']);
    assert.deepEqual(owners('alpha/src/one/entry.lib.avt'), ['alpha@web', 'beta@web']);
    assert.deepEqual(owners('alpha/src/two/entry.lib.avt'), ['alpha@web']);
    assert.deepEqual(owners('alpha/src/two/other.lib.avt'), []);
    assert.deepEqual(owners('alpha/src-neighbor/two/entry.lib.avt'), []);

    await save('beta', 2, ['../alpha/src/two/entry.lib.avt']);
    assert.deepEqual(owners('alpha/src/one/entry.lib.avt'), ['alpha@web']);
    assert.deepEqual(owners('alpha/src/two/entry.lib.avt'), ['alpha@web', 'beta@web']);

    await save('alpha', 2, ['./src/one/entry.lib.avt']);
    assert.deepEqual(owners('alpha/src/one/entry.lib.avt'), ['alpha@web']);
    assert.deepEqual(owners('alpha/src/two/entry.lib.avt'), ['beta@web']);
    assert.deepEqual(owners('alpha/src/two/entry.lib.avt.bak'), []);
});
