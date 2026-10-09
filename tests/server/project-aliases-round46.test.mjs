import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Project }, { Build }] = await loadServerModules(['project/Project.ts', 'project/Build.ts']);

test('two aliases to the same source folder resolve identically from nested and sibling files', t => {
    const root = mkdtempSync(join(import.meta.dirname, '.aliases-round46-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const project = Object.create(Project.prototype);
    project.configFile = { folderPath: root };
    project.config = { aliases: { '@src': 'src', '@code': './src/' } };

    for (const current of [join(root, 'src', 'view'), join(root, 'tests')]) {
        const first = project.resolveAlias('@src/models/User', current);
        const second = project.resolveAlias('@code/models/User', { folderPath: current });
        assert.equal(first, second);
    }
    assert.equal(project.resolveAlias('@src/models/User', join(root, 'src', 'view')), '../models/User');
    assert.equal(project.resolveAlias('@code/models/User', join(root, 'tests')), '../src/models/User');
});

test('alias names use the complete initial path segment and unknown names stay unchanged', t => {
    const root = mkdtempSync(join(import.meta.dirname, '.aliases-round46-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const project = Object.create(Project.prototype);
    project.configFile = { folderPath: root };
    project.config = { aliases: { '@src': 'src', '@src-extra': 'other' } };
    const current = join(root, 'src');

    assert.equal(project.resolveAlias('@src/file', current), './file');
    assert.equal(project.resolveAlias('@src-extra/file', current), '../other/file');
    assert.equal(project.resolveAlias('@src-more/file', current), '@src-more/file');
    assert.equal(project.resolveAlias('./@src/file', current), './@src/file');
});

test('namespace assembly keeps exports from two independently built source chunks', () => {
    const build = Object.create(Build.prototype);
    const first = build._buildStringModule('Demo.Components', [], [
        'class First { static source = "first"; }', '_.First = First;',
    ], {}, [], []);
    const second = build._buildStringModule('Demo.Components', [], [
        'class Second { static source = "second"; }', '_.Second = Second;',
    ], {}, [], []);
    const context = vm.createContext({});
    vm.runInContext(first + second, context);

    assert.equal(context.Demo.Components.First.source, 'first');
    assert.equal(context.Demo.Components.Second.source, 'second');
    assert.deepEqual(Object.keys(context.Demo.Components).sort(), ['First', 'Second']);
});
