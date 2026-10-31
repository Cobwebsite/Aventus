import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }, { Build }] = await loadServerModules(['project/Project.ts', 'project/Build.ts']);

function projectAt(root, aliases) {
    const project = Object.create(Project.prototype);
    project.configFile = { folderPath: root };
    project.config = { aliases };
    return project;
}

test('alias paths normalize parent segments and resolve from both sibling and nested folders', t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-alias-boundary-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const project = projectAt(root, { '@shared': './src/../shared/' });

    assert.equal(project.resolveAlias('@shared/model', join(root, 'src')), '../shared/model');
    assert.equal(project.resolveAlias('@shared/model', { folderPath: join(root, 'shared', 'nested') }), '../model');
    assert.equal(project.resolveAlias('@shared/model', join(root, 'shared')), './model');
});

test('unknown and prefix-colliding aliases preserve the original path', t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-alias-boundary-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const project = projectAt(root, { '@a': 'src/a', '@ab': 'src/ab' });
    const current = join(root, 'src');

    assert.equal(project.resolveAlias('@a/item', current), './a/item');
    assert.equal(project.resolveAlias('@ab/item', current), './ab/item');
    assert.equal(project.resolveAlias('@abc/item', current), '@abc/item');
    assert.equal(project.resolveAlias('@missing/item', current), '@missing/item');
    assert.equal(project.resolveAlias('local/@a/item', current), 'local/@a/item');
});

test('folder namespace uses the component parent and camel-cases nested folder segments', () => {
    const build = Object.create(Build.prototype);
    build.buildConfig = { namespaceStrategy: 'followFoldersCamelCase', namespaceRoot: 'D:/app/src/' };

    assert.equal(build.getNamespaceForUri('file:///D:/app/src/admin-panel/user_data/widget.lib.avt'), 'AdminPanel.UserData');
    assert.equal(build.getNamespaceForUri('file:///D:/app/src/admin-panel/user_data/widget.wcl.avt'), 'AdminPanel');
});

test('namespace rules retain declared precedence when multiple patterns match', () => {
    const build = Object.create(Build.prototype);
    build.buildConfig = { namespaceStrategy: 'rules', namespaceRulesRegex: {
        Generic: /\/src\//, Specific: /\/src\/admin\//,
    } };
    assert.equal(build.getNamespaceForUri('file:///D:/app/src/admin/page.lib.avt'), 'Generic');
    assert.equal(build.getNamespaceForUri('file:///D:/app/other/page.lib.avt'), '');
});
