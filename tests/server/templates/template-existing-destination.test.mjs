import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ TemplateScript }, { GenericServer }, { ProjectManager }, { FilesManager }] = await loadServerModules([
    'files/Template.ts', 'GenericServer.ts', 'project/ProjectManager.ts', 'files/FilesManager.ts',
]);

test('real template updates an existing destination and excludes an entire directory before registration', { timeout: 15_000 }, async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-existing-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const templateDir = join(root, 'template');
    const destination = join(root, 'output');
    mkdirSync(templateDir);
    mkdirSync(destination);
    mkdirSync(join(templateDir, 'ignored'));
    writeFileSync(join(templateDir, 'Main.lib.avt'), 'new content');
    writeFileSync(join(templateDir, 'ignored', 'Hidden.lib.avt'), 'hidden content');
    writeFileSync(join(templateDir, 'readme.txt'), 'new readme');
    writeFileSync(join(destination, 'Main.lib.avt'), 'old content');
    writeFileSync(join(destination, 'keep.txt'), 'preserved');
    const config = join(templateDir, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Existing destination fixture', isProject: false }; }",
        '  async run() {',
        "    await this.writeFile(info => !info.isDir || !info.relativePath.endsWith('ignored'));",
        '  }',
        '}',
    ].join('\n'));

    const previous = {
        server: GenericServer.instance, memory: TemplateScript.memory,
        projects: ProjectManager.instance, files: FilesManager.instance,
    };
    t.after(() => {
        GenericServer.instance = previous.server;
        TemplateScript.memory = previous.memory;
        ProjectManager.instance = previous.projects;
        FilesManager.instance = previous.files;
    });
    const registered = [];
    const errors = [];
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: { error: value => errors.push(String(value)) },
    };
    TemplateScript.memory = {};
    ProjectManager.instance = { getMatchingBuildsByUri: () => [] };
    FilesManager.instance = { onCreatedUri: uri => registered.push(uri) };

    const script = await TemplateScript.create(config);
    assert.ok(script, errors.join('\n'));
    await script.init(destination, root);

    assert.equal(readFileSync(join(destination, 'Main.lib.avt'), 'utf8'), 'new content');
    assert.equal(readFileSync(join(destination, 'keep.txt'), 'utf8'), 'preserved');
    assert.equal(readFileSync(join(destination, 'readme.txt'), 'utf8'), 'new readme');
    assert.equal(existsSync(join(destination, 'ignored')), false);
    assert.deepEqual(registered.map(uri => uri.replaceAll('\\', '/').split('/').at(-1)), ['Main.lib.avt']);
    assert.deepEqual(errors, []);
});
