import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ DependencyManager }] = await loadServerModules(['project/DependencyManager.ts']);

test('Store package header reading preserves the full first line with or without a newline', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-package-header-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const manager = Object.create(DependencyManager.prototype);
    const header = '// Widget:1.2.3';
    const withNewline = join(root, 'with-newline.package.avt');
    const withoutNewline = join(root, 'without-newline.package.avt');
    writeFileSync(withNewline, `${header}\n// rest`);
    writeFileSync(withoutNewline, header);

    assert.equal(await manager.readFirstLine(withNewline), header);
    assert.equal(await manager.readFirstLine(withoutNewline), header);
});
