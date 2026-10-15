import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModule } from './helpers/load-ts.mjs';

const { execFileAsync } = await loadServerModule('tools.ts');

test('Windows command launcher receives a path with spaces and shell characters as one argument',
    { skip: process.platform !== 'win32' }, async t => {
        const root = mkdtempSync(join(tmpdir(), 'aventus-converter-args-'));
        t.after(() => rmSync(root, { recursive: true, force: true }));
        const launcher = join(root, 'converter.cmd');
        const input = join(root, 'space & (config).avt');
        writeFileSync(launcher, '@echo off\r\ntype %1\r\n');
        writeFileSync(input, 'argument arrived');

        const { stdout } = await execFileAsync(launcher, [input], { encoding: 'utf8' });
        assert.equal(stdout.trim(), 'argument arrived');
    });
