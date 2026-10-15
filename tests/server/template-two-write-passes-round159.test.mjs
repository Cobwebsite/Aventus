import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateScript }, { GenericServer }, { ProjectManager }, { FilesManager }] = await loadServerModules([
    'files/Template.ts', 'GenericServer.ts', 'project/ProjectManager.ts', 'files/FilesManager.ts',
]);

test('two write passes in one template run keep rejected files out of registration', { timeout: 15_000 }, async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-two-writes-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const templateDir = join(root, 'template');
    const destination = join(root, 'output');
    mkdirSync(templateDir);
    mkdirSync(destination);
    writeFileSync(join(templateDir, 'Keep.lib.avt'), 'class ${{name}} {}');
    writeFileSync(join(templateDir, 'Skip.lib.avt'), 'class Skip {}');
    const config = join(templateDir, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Two writes fixture' }; }",
        '  async run() {',
        '    await this.writeFile(() => false);',
        "    this.registerVar('name', 'Final');",
        "    await this.writeFile(info => !info.relativePath.endsWith('Skip.lib.avt'));",
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

    assert.equal(readFileSync(join(destination, 'Keep.lib.avt'), 'utf8'), 'class Final {}');
    assert.equal(existsSync(join(destination, 'Skip.lib.avt')), false);
    assert.deepEqual(registered.map(uri => uri.replaceAll('\\', '/').split('/').at(-1)), ['Keep.lib.avt']);
    assert.deepEqual(errors, []);
});
