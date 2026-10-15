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

test('template generation resolves namespace for each destination file and opens multiple generated files', { timeout: 15_000 }, async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-namespace-'));
    const source = join(root, 'source');
    const destination = join(root, 'destination');
    mkdirSync(source);
    mkdirSync(destination);
    const config = join(source, 'template.avt.ts');
    const base = pathToFileURL(resolve('lib/templateScript/AventusTemplate.ts')).href;
    writeFileSync(join(source, 'Alpha.lib.avt'), 'namespace=${{namespace}}');
    writeFileSync(join(source, 'Beta.lib.avt'), 'namespace=${{namespace}}');
    writeFileSync(config, [
        `import { AventusTemplate } from '${base}';`,
        'export class Template extends AventusTemplate {',
        "  meta() { return { name: 'Namespace fixture' }; }",
        '  async run() {',
        '    await this.writeFile();',
        "    this.openFile(['Alpha.lib.avt', 'Beta.lib.avt']);",
        '  }',
        '}',
    ].join('\n'));

    const previous = [GenericServer.instance, TemplateScript.memory, ProjectManager.instance, FilesManager.instance];
    const requested = [];
    const registered = [];
    const opened = [];
    GenericServer.instance = {
        _savePath: root, _extensionPath: resolve('.'), logLevel: 99,
        connection: {
            sendNotification: (name, path) => opened.push([name, path]),
            error: error => assert.fail(String(error)),
        },
    };
    TemplateScript.memory = {};
    ProjectManager.instance = {
        getMatchingBuildsByUri(uri) {
            requested.push(uri);
            return [{ getNamespaceForUri: target => target.includes('Alpha') ? 'Alpha.Namespace' : 'Beta.Namespace' }];
        },
    };
    FilesManager.instance = { onCreatedUri: uri => registered.push(uri) };
    try {
        const script = await TemplateScript.create(config);
        assert.ok(script);
        await script.init(destination, root);
        assert.equal(readFileSync(join(destination, 'Alpha.lib.avt'), 'utf8'), 'namespace=Alpha.Namespace');
        assert.equal(readFileSync(join(destination, 'Beta.lib.avt'), 'utf8'), 'namespace=Beta.Namespace');
        assert.equal(requested.length, 2);
        assert.deepEqual(new Set(requested.map(uri => /Alpha/.test(uri) ? 'Alpha' : 'Beta')), new Set(['Alpha', 'Beta']));
        assert.deepEqual(new Set(registered.map(uri => /Alpha/.test(uri) ? 'Alpha' : 'Beta')), new Set(['Alpha', 'Beta']));
        assert.equal(opened.length, 2);
        assert.ok(opened.every(([name]) => name === 'aventus/openfile'));
        assert.deepEqual(new Set(opened.map(([, uri]) => /Alpha/.test(uri) ? 'Alpha' : 'Beta')), new Set(['Alpha', 'Beta']));
    } finally {
        [GenericServer.instance, TemplateScript.memory, ProjectManager.instance, FilesManager.instance] = previous;
        rmSync(root, { recursive: true, force: true });
    }
});
