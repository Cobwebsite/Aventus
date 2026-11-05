import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { chromium } from 'playwright';

const fixture = resolve(import.meta.dirname, '../fixtures/reference-project');
const cli = resolve(import.meta.dirname, '../../../cli/out/cli.js');

export function copyProject(t) {
    const root = mkdtempSync(join(tmpdir(), 'aventus-runtime-project-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    cpSync(fixture, root, { recursive: true,
        filter: source => source !== join(fixture, 'dist'),
    });
    cpSync(resolve(import.meta.dirname, '../../../base/src/attributes/Attributes.def.avt'),
        join(root, 'src/Attributes.def.avt'));
    return root;
}

export function runBuild(root) {
    return spawnSync(process.execPath, [cli, 'build', join(root, 'aventus.conf.avt'), '--json'], {
        cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024,
        env: { ...process.env, APPDATA: join(root, 'appdata') },
    });
}

export function buildProject(root) {
    const result = runBuild(root);
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.success, true, result.stdout);
    assert.equal(report.builds['RuntimeReference@Main'].success, true);
    const output = join(root, 'dist/runtime-reference.js');
    assert.equal(existsSync(output), true);
    return { code: readFileSync(output, 'utf8'), report };
}

export async function openCompiledPage(t, code) {
    const browser = await chromium.launch();
    t.after(() => browser.close());
    const page = await browser.newPage();
    await page.goto('about:blank');
    await page.addScriptTag({ content: code });
    return page;
}

