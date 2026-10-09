import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Build }, { GenericServer }] = await loadServerModules(['project/Build.ts', 'GenericServer.ts']);
GenericServer.instance = { isIDE: false };

function build(config = {}) {
    const instance = Object.create(Build.prototype);
    instance.buildConfig = {
        fullname: 'Demo@web', module: 'Demo', hideWarnings: false,
        nodeModulesDir: 'D:/demo/node_modules', compile: [],
        namespaceStrategy: 'manual', namespaceRulesRegex: {}, namespaceRoot: 'D:/demo/src/',
        componentPrefix: 'demo', avoidParsingInsideTags: ['code'],
        ...config,
    };
    instance.project = { isCoreBuild: false, getConfig: () => ({ aliases: { '@ui': 'src/ui' } }) };
    instance._allowBuild = true;
    instance._outputPathes = ['D:/demo/out.package.avt'];
    instance.noNamespaceUri = {};
    instance.npmAliases = {};
    instance.npmNameCount = {};
    instance.namespaces = [];
    return instance;
}

test('build exposes configuration and separates npm output from stories', () => {
    const ordinary = build({ compile: [{ outputNpm: { path: [] } }] });
    assert.equal(ordinary.fullname, 'Demo@web');
    assert.equal(ordinary.module, 'Demo');
    assert.equal(ordinary.getComponentPrefix(), 'demo');
    assert.deepEqual(ordinary.getAvoidParsingTags(), ['code']);
    assert.deepEqual(ordinary.getAliases(), { '@ui': 'src/ui' });
    assert.equal(ordinary.hasNpmOutput, false);
    assert.equal(ordinary.hasStories, false);
    assert.deepEqual(ordinary.outputPathes, ['D:/demo/out.package.avt']);

    assert.equal(build({ compile: [{ outputNpm: { path: ['dist'] } }] }).hasNpmOutput, true);
    assert.equal(build({ compile: [], stories: {} }).hasNpmOutput, true);
});

test('build enable and disable change the build gate', () => {
    const instance = build();
    assert.equal(instance.isBuildAllowed, true);
    instance.disableBuild();
    assert.equal(instance.isBuildAllowed, false);
    instance.enableBuild();
    assert.equal(instance.isBuildAllowed, true);
});

test('build namespace strategies resolve matching rules and folders', () => {
    const uri = 'file:///D:/demo/src/admin/user.lib.avt';
    const rules = build({ namespaceStrategy: 'rules', namespaceRulesRegex: { Admin: /\/admin\//, Other: /\/other\// } });
    assert.equal(rules.getNamespaceForUri(uri), 'Admin');
    assert.equal(rules.getNamespaceForUri('file:///D:/demo/src/unknown.lib.avt'), '');

    const folders = build({ namespaceStrategy: 'followFolders' });
    assert.equal(folders.getNamespaceForUri(uri), 'admin');
    const camel = build({ namespaceStrategy: 'followFoldersCamelCase' });
    assert.equal(camel.getNamespaceForUri('file:///D:/demo/src/admin-panel/user.lib.avt'), 'AdminPanel');
    assert.equal(build().getNamespaceForUri(uri), '');
});

test('build namespaces and npm replacement names stay unique', () => {
    const instance = build({ compile: [{ outputNpm: { path: ['dist'] } }] });
    instance.addNamespace('App.UI');
    instance.addNamespace('App.UI');
    instance.addNamespace('App.Data');
    assert.deepEqual(instance.namespaces, ['App', 'App.UI', 'App.Data']);
    assert.equal(instance.getNpmReplacementName('App.Button', 'App.Button'), 'Button');
    assert.equal(instance.getNpmReplacementName('App.Button', 'Other.Button'), 'Button1');
    assert.equal(instance.getNpmReplacementName('App.Button', 'Other.Button'), 'Button1');
    assert.equal(instance.getNpmReplacementName('App.Button', 'Third.Button'), 'Button2');
    assert.equal(build().getNpmReplacementName('App.Button', 'Other.Button'), '');
});

test('build routes renameable TypeScript files and ignores unrelated extensions', async () => {
    const instance = build();
    const calls = [];
    instance.tsLanguageService = { onRenameFile: async (...args) => { calls.push(args); return { edited: [] }; } };
    assert.deepEqual(await instance.onRename([{ oldUri: 'file:///old.lib.avt', newUri: 'file:///new.lib.avt' }]), { edited: [] });
    assert.deepEqual(calls, [['file:///old.lib.avt', 'file:///new.lib.avt']]);
    assert.deepEqual(await instance.onRename([{ oldUri: 'file:///style.scss', newUri: 'file:///new.scss' }]), {});
    assert.equal(calls.length, 1);
});

test('build skips work before initialization and in no-build mode', async () => {
    const instance = build();
    const calls = [];
    instance._build = async () => calls.push('build');
    GenericServer.instance = {
        isIDE: false, _noBuild: false,
        connection: { delayBetweenBuild: () => 0 },
    };
    await instance.build();
    assert.deepEqual(calls, []);
    instance.initDone = true;
    GenericServer.instance._noBuild = true;
    await instance.build();
    assert.deepEqual(calls, []);
    GenericServer.instance._noBuild = false;
    await instance.build();
    assert.deepEqual(calls, ['build']);
});

test('build groups rapid requests into a single delayed compilation', async t => {
    const instance = build();
    instance.initDone = true;
    const calls = [];
    instance._build = async () => calls.push('build');
    GenericServer.instance = {
        isIDE: false, _noBuild: false,
        connection: { delayBetweenBuild: () => 15 },
    };
    t.after(() => clearTimeout(instance.timerBuild));
    await instance.build();
    await instance.build();
    await new Promise(resolve => setTimeout(resolve, 40));
    assert.deepEqual(calls, ['build']);
});
