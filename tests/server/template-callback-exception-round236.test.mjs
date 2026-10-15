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

test('real template retries after a callback exception during file copying', { timeout: 20_000 }, async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-callback-exception-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const templateDir = join(root, 'template');
    const destination = join(root, 'output');
    mkdirSync(templateDir);
    mkdirSync(destination);
    writeFileSync(join(templateDir, 'A.lib.avt'), 'first');
    writeFileSync(join(templateDir, 'B.lib.avt'), 'second');
    const config = join(templateDir, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    const scriptSource = fail => [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Callback exception fixture' }; }",
        '  async run() {',
        `    await this.writeFile(info => { if (${fail} && info.relativePath.endsWith('B.lib.avt')) throw new Error('callback failure'); return true; });`,
        '  }',
        '}',
    ].join('\n');
    writeFileSync(config, scriptSource(true));

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

    const first = await TemplateScript.create(config);
    assert.ok(first, errors.join('\n'));
    await first.init(destination, root);
    assert.equal(readFileSync(join(destination, 'A.lib.avt'), 'utf8'), 'first');
    assert.equal(existsSync(join(destination, 'B.lib.avt')), false);
    assert.deepEqual(registered.map(uri => uri.replaceAll('\\', '/').split('/').at(-1)), ['A.lib.avt']);

    writeFileSync(config, scriptSource(false));
    TemplateScript.memory = {};
    const second = await TemplateScript.create(config);
    assert.ok(second, errors.join('\n'));
    await second.init(destination, root);
    assert.equal(readFileSync(join(destination, 'B.lib.avt'), 'utf8'), 'second');
    assert.deepEqual(registered.map(uri => uri.replaceAll('\\', '/').split('/').at(-1)), ['A.lib.avt', 'A.lib.avt', 'B.lib.avt']);
});
