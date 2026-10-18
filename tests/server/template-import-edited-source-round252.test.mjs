import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ TemplateManager }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'files/TemplateManager.ts', 'files/Template.ts', 'GenericServer.ts',
]);

test('template import copies the latest source after selection and retains the parsed destination', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-template-edited-source-'));
    const source = join(root, 'extension', 'templates', 'templates', 'sample');
    const destination = join(root, 'installed');
    mkdirSync(source, { recursive: true });
    mkdirSync(destination);
    writeFileSync(join(source, 'template.avt.ts'), 'before');
    writeFileSync(join(source, 'old.txt'), 'old');

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
        _template: { workspaces: [root] },
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
    manager.templatePath = [destination];
    manager.reloadTemplates = async () => { reloads++; };

    const importPending = manager.selectTemplateToImport();
    await atSelection;
    rmSync(join(source, 'old.txt'));
    writeFileSync(join(source, 'template.avt.ts'), 'after');
    writeFileSync(join(source, 'new.txt'), 'new');
    releaseSelection();
    await importPending;

    assert.equal(readFileSync(join(destination, 'before', 'template.avt.ts'), 'utf8'), 'after');
    assert.equal(readFileSync(join(destination, 'before', 'new.txt'), 'utf8'), 'new');
    assert.equal(existsSync(join(destination, 'before', 'old.txt')), false);
    assert.equal(existsSync(join(destination, 'after')), false);
    assert.equal(parses, 1);
    assert.equal(reloads, 1);
    assert.deepEqual(messages, ['Templates installed']);
});
