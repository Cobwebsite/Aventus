import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ GenericServer }, { pathToUri }, { Dependency }, { DependencyManager }, { ManifestPackage }] = await loadServerModules([
    'GenericServer.ts', 'tools.ts', 'cmds/ai/Dependency.ts', 'project/DependencyManager.ts',
    'manifest/ManifestPackage.ts',
]);

test('AI dependency command replaces stale Markdown and skips packages without documentation', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-ai-dependencies-'));
    const output = join(root, '.aventus', 'dependencies');
    mkdirSync(output, { recursive: true });
    writeFileSync(join(output, 'stale.md'), 'obsolete');
    const previous = {
        server: GenericServer.instance,
        dependencies: DependencyManager.getInstance,
        markdown: ManifestPackage.getMarkdown,
        log: console.log,
    };
    const packages = [
        { name: 'Alpha', file: { uri: 'file:///alpha.package.avt' } },
        { name: 'Undocumented', file: { uri: 'file:///empty.package.avt' } },
    ];
    GenericServer.instance = { isIDE: true, workspaces: [pathToUri(root)] };
    DependencyManager.getInstance = () => ({ packages });
    ManifestPackage.getMarkdown = uri => uri.includes('alpha') ? '# Alpha\nDetails' : '';
    console.log = () => {};
    try {
        await Dependency.run();
        assert.equal(readFileSync(join(output, 'Alpha.md'), 'utf8'), '# Alpha\nDetails');
        assert.equal(existsSync(join(output, 'Undocumented.md')), false);
        assert.equal(existsSync(join(output, 'stale.md')), false);

        packages.splice(0, packages.length, { name: 'Beta', file: { uri: 'file:///beta.package.avt' } });
        ManifestPackage.getMarkdown = () => '# Beta';
        await Dependency.run();
        assert.equal(readFileSync(join(output, 'Beta.md'), 'utf8'), '# Beta');
        assert.equal(existsSync(join(output, 'Alpha.md')), false);
    } finally {
        GenericServer.instance = previous.server;
        DependencyManager.getInstance = previous.dependencies;
        ManifestPackage.getMarkdown = previous.markdown;
        console.log = previous.log;
        rmSync(root, { recursive: true, force: true });
    }
});
