import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const require = createRequire(import.meta.url);
const { Open } = require('unzipper');
const [{ Store }] = await loadServerModules(['store/Store.ts']);

test('Store archive excludes Git metadata at every depth', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-nested-git-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const source = join(root, 'template');
    mkdirSync(join(source, '.git'), { recursive: true });
    mkdirSync(join(source, 'nested', '.git'), { recursive: true });
    writeFileSync(join(source, 'template.avt.ts'), 'export class Template {}');
    writeFileSync(join(source, '.git', 'config'), 'root private metadata');
    writeFileSync(join(source, 'nested', '.git', 'config'), 'nested private metadata');
    writeFileSync(join(source, 'nested', 'content.txt'), 'template content');

    const archivePath = join(root, 'template.zip');
    await Store.zip(source, archivePath);
    const archive = await Open.file(archivePath);
    const names = archive.files.map(file => file.path);
    assert.ok(names.includes('template.avt.ts'));
    assert.ok(names.includes('nested/content.txt'));
    assert.ok(names.every(name => !name.split('/').includes('.git')));
});
