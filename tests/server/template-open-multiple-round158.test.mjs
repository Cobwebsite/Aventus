import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateScript }, { GenericServer }, { ProjectManager }, { FilesManager }] = await loadServerModules([
    'files/Template.ts', 'GenericServer.ts', 'project/ProjectManager.ts', 'files/FilesManager.ts',
]);

test('real template opens several generated files in requested order and relays user messages', { timeout: 15_000 }, async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-open-multiple-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const templateDir = join(root, 'template');
    const destination = join(root, 'output');
    mkdirSync(join(templateDir, 'src'), { recursive: true });
    mkdirSync(destination);
    writeFileSync(join(templateDir, 'src', 'First.lib.avt'), 'first');
    writeFileSync(join(templateDir, 'src', 'Second.lib.avt'), 'second');
    const config = join(templateDir, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Open multiple fixture' }; }",
        '  async run() {',
        '    await this.writeFile();',
        "    this.openFile(['src/Second.lib.avt', 'src/First.lib.avt']);",
        "    this.showInformationMessage('ready');",
        "    this.showWarningMessage('warning');",
        "    this.showErrorMessage('error');",
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
    const opened = [];
    const messages = [];
    const registered = [];
    const errors = [];
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: {
            sendNotification: (method, uri) => opened.push([method, uri]),
            showInformationMessage: value => messages.push(['information', value]),
            showWarningMessage: value => messages.push(['warning', value]),
            showErrorMessage: value => messages.push(['error', value]),
            error: value => errors.push(String(value)),
        },
    };
    TemplateScript.memory = {};
    ProjectManager.instance = { getMatchingBuildsByUri: () => [] };
    FilesManager.instance = { onCreatedUri: uri => registered.push(uri) };

    const script = await TemplateScript.create(config);
    assert.ok(script, errors.join('\n'));
    await script.init(destination, root);

    assert.equal(readFileSync(join(destination, 'src', 'First.lib.avt'), 'utf8'), 'first');
    assert.equal(readFileSync(join(destination, 'src', 'Second.lib.avt'), 'utf8'), 'second');
    assert.deepEqual(opened, [
        ['aventus/openfile', [pathToFileURL(join(destination, 'src', 'Second.lib.avt')).href]],
        ['aventus/openfile', [pathToFileURL(join(destination, 'src', 'First.lib.avt')).href]],
    ]);
    assert.deepEqual(messages, [['information', 'ready'], ['warning', 'warning'], ['error', 'error']]);
    assert.deepEqual(registered.map(uri => uri.replaceAll('\\', '/').split('/').at(-1)), ['First.lib.avt', 'Second.lib.avt']);
    assert.deepEqual(errors, []);
});
