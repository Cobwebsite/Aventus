import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ TemplateScript }, { GenericServer }, { ProjectManager }, { FilesManager }] = await loadServerModules([
    'files/Template.ts', 'GenericServer.ts', 'project/ProjectManager.ts', 'files/FilesManager.ts',
]);

test('template variables preserve dollar sequences in paths and file contents', { timeout: 15_000 }, async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-dollar-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const source = join(root, 'source');
    const destination = join(root, 'destination');
    mkdirSync(source);
    mkdirSync(destination);
    const config = join(source, 'template.avt.ts');
    const replacement = "Cash$&$'$`$$Tail";
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(join(source, '${{name}}.lib.avt'), 'export const label = "${{name}}";');
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Dollar fixture' }; }",
        '  async run() {',
        `    this.registerVar('name', ${JSON.stringify(replacement)});`,
        '    await this.writeFile();',
        '  }',
        '}',
    ].join('\n'));

    const previous = [GenericServer.instance, TemplateScript.memory, ProjectManager.instance, FilesManager.instance];
    const registered = [];
    const errors = [];
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: { error: value => errors.push(String(value)) },
    };
    TemplateScript.memory = {};
    ProjectManager.instance = { getMatchingBuildsByUri: () => [] };
    FilesManager.instance = { onCreatedUri: uri => registered.push(uri) };
    t.after(() => {
        [GenericServer.instance, TemplateScript.memory, ProjectManager.instance, FilesManager.instance] = previous;
    });

    const script = await TemplateScript.create(config);
    assert.ok(script, errors.join('\n'));
    await script.init(destination, root);

    const output = join(destination, `${replacement}.lib.avt`);
    assert.equal(readFileSync(output, 'utf8'), `export const label = "${replacement}";`);
    assert.equal(registered.length, 1);
    assert.ok(decodeURIComponent(registered[0]).endsWith(`${replacement}.lib.avt`));
    assert.deepEqual(errors, []);
});
