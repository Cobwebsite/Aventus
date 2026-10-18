import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

test('project import copies edited source content after selection but retains the parsed installation folder', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-import-source-edited-'));
    const source = join(root, 'extension', 'templates', 'projects', 'sample');
    const destination = join(root, 'installed');
    mkdirSync(source, { recursive: true });
    mkdirSync(destination);
    writeFileSync(join(source, 'template.avt.ts'), 'before');
    writeFileSync(join(source, 'old.txt'), 'old content');

    const previousServer = GenericServer.instance;
    const previousCreate = TemplateScript.create;
    t.after(() => {
        GenericServer.instance = previousServer;
        TemplateScript.create = previousCreate;
        rmSync(root, { recursive: true, force: true });
    });

    let releaseSelection;
    let selectionStarted;
    const atSelection = new Promise(resolve => { selectionStarted = resolve; });
    const selectionPending = new Promise(resolve => { releaseSelection = resolve; });
    const messages = [];
    let parses = 0;
    let reloads = 0;
    GenericServer.instance = {
        _extensionPath: join(root, 'extension'),
        logLevel: 99,
        connection: {
            Select: async () => ({ label: 'Local' }),
            SelectMultiple: async items => {
                selectionStarted();
                await selectionPending;
                return items;
            },
            showInformationMessage: message => messages.push(message),
            showErrorMessage: message => { throw new Error(message); },
        },
    };
    TemplateScript.create = async path => {
        parses++;
        return { name: 'Sample', installationFolder: readFileSync(path, 'utf8') };
    };

    const manager = Object.create(TemplateManager.prototype);
    manager.projectPath = [destination];
    manager.reloadProjects = async () => { reloads++; };

    const importPending = manager.selectProjectToImport(false);
    await atSelection;
    rmSync(join(source, 'old.txt'));
    writeFileSync(join(source, 'template.avt.ts'), 'after');
    writeFileSync(join(source, 'new.txt'), 'new content');
    releaseSelection();
    await importPending;

    assert.equal(readFileSync(join(destination, 'before', 'template.avt.ts'), 'utf8'), 'after');
    assert.equal(readFileSync(join(destination, 'before', 'new.txt'), 'utf8'), 'new content');
    assert.equal(existsSync(join(destination, 'before', 'old.txt')), false);
    assert.equal(existsSync(join(destination, 'after')), false);
    assert.equal(parses, 1);
    assert.equal(reloads, 1);
    assert.deepEqual(messages, ['Projects installed']);
});
