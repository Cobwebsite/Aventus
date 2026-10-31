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

test('real project template resolves namespace per file and registers config after generated sources', { timeout: 15_000 }, async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-project-namespace-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const templateDir = join(root, 'template');
    const destination = join(root, 'output');
    mkdirSync(templateDir);
    mkdirSync(destination);
    const templatePath = join(templateDir, 'template.avt.ts');
    const sourcePath = join(templateDir, 'Panel.wcl.avt');
    const unmatchedPath = join(templateDir, 'Unmatched.wcl.avt');
    const configPath = join(templateDir, '!aventus.conf.avt');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(sourcePath, '#{{namespace}}\n\texport class Panel {}\n#{{namespace/}}');
    writeFileSync(unmatchedPath, '#{{namespace}}\n\texport class Unmatched {}\n#{{namespace/}}');
    writeFileSync(configPath, '{"name":"Panel"}');
    writeFileSync(templatePath, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Project fixture', isProject: true }; }",
        '  async run() { await this.writeFile(); }',
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
    const namespaceRequests = [];
    const errors = [];
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: { error: error => errors.push(String(error)) },
    };
    TemplateScript.memory = {};
    ProjectManager.instance = {
        getMatchingBuildsByUri: uri => {
            namespaceRequests.push(uri);
            return uri.endsWith('Panel.wcl.avt') ? [{ getNamespaceForUri: () => 'App.Panel' }] : [];
        },
    };
    FilesManager.instance = { onCreatedUri: uri => registered.push(uri) };

    const script = await TemplateScript.create(templatePath);
    assert.ok(script, errors.join('\n'));
    await script.init(destination, root);

    assert.equal(readFileSync(join(destination, 'Panel.wcl.avt'), 'utf8'), 'namespace App.Panel {\n\texport class Panel {}\n}');
    assert.equal(readFileSync(join(destination, 'Unmatched.wcl.avt'), 'utf8'), 'export class Unmatched {}');
    assert.equal(readFileSync(join(destination, 'aventus.conf.avt'), 'utf8'), '{"name":"Panel"}');
    assert.equal(existsSync(join(destination, '!aventus.conf.avt')), false);
    assert.deepEqual(registered.map(uri => uri.replaceAll('\\', '/').split('/').at(-1)), [
        'Panel.wcl.avt', 'Unmatched.wcl.avt', 'aventus.conf.avt',
    ]);
    assert.deepEqual(namespaceRequests.map(uri => uri.replaceAll('\\', '/').split('/').at(-1)).sort(), [
        '!aventus.conf.avt', 'Panel.wcl.avt', 'Unmatched.wcl.avt',
    ]);
    assert.deepEqual(errors, []);
});
