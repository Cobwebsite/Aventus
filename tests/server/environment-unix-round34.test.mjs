import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadServerModule } from './helpers/load-ts.mjs';

const { initEnvironnment } = await loadServerModule('environment.ts');

async function waitForFile(path, marker) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (existsSync(path) && readFileSync(path, 'utf8').includes(marker)) return;
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw Error(`Environment file not written: ${path}`);
}

test('Unix environment installation writes an isolated shell file and escapes apostrophes', async t => {
    const root = mkdtempSync(join(process.cwd(), 'aventus-unix-env-'));
    const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    const originalHome = process.env.HOME;
    const originalShell = process.env.SHELL;
    t.after(() => {
        Object.defineProperty(process, 'platform', originalPlatform);
        if (originalHome === undefined) delete process.env.HOME;
        else process.env.HOME = originalHome;
        if (originalShell === undefined) delete process.env.SHELL;
        else process.env.SHELL = originalShell;
        rmSync(root, { recursive: true, force: true });
    });
    Object.defineProperty(process, 'platform', { ...originalPlatform, value: 'linux' });
    process.env.HOME = root;
    process.env.SHELL = '/bin/bash';
    const extension = join(root, "extension's folder");
    await initEnvironnment(extension);
    const bashrc = join(root, '.bashrc');
    await waitForFile(bashrc, '# <<< Aventus environment <<<');
    const environmentFile = join(root, '.aventus-env');
    const content = readFileSync(environmentFile, 'utf8');
    assert.match(content, /export AVENTUS_BIN='/);
    assert.ok(content.includes(resolve(extension, 'lib', 'bin').replace(/'/g, "'\\''")));
    assert.match(content, /export PATH="\$AVENTUS_BIN:\$PATH"/);
    const shellConfig = readFileSync(bashrc, 'utf8');
    assert.match(shellConfig, /# >>> Aventus environment >>>/);
    assert.match(shellConfig, /\.aventus-env/);
});

test('Unix installer rejection currently escapes the initializer catch block', () => {
    const helper = new URL('./helpers/load-ts.mjs', import.meta.url).href;
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const code = `
        const { loadServerModule } = await import(${JSON.stringify(helper)});
        const { initEnvironnment } = await loadServerModule('environment.ts');
        Object.defineProperty(process, 'platform', { value: 'linux' });
        delete process.env.HOME;
        await initEnvironnment('/temporary/extension');
    `;
    const result = spawnSync(process.execPath, ['--unhandled-rejections=strict', '--input-type=module', '-e', code], {
        cwd: root, encoding: 'utf8', timeout: 10_000,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Can't determine the user folder/);
});

test('Unix installer replaces an existing zsh marker block while retaining surrounding settings', async t => {
    const root = mkdtempSync(join(process.cwd(), 'aventus-zsh-env-'));
    const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    const originalHome = process.env.HOME;
    const originalShell = process.env.SHELL;
    t.after(() => {
        Object.defineProperty(process, 'platform', originalPlatform);
        if (originalHome === undefined) delete process.env.HOME;
        else process.env.HOME = originalHome;
        if (originalShell === undefined) delete process.env.SHELL;
        else process.env.SHELL = originalShell;
        rmSync(root, { recursive: true, force: true });
    });
    Object.defineProperty(process, 'platform', { ...originalPlatform, value: 'linux' });
    process.env.HOME = root;
    process.env.SHELL = '/bin/zsh';
    const zshrc = join(root, '.zshrc');
    writeFileSync(zshrc, 'before\n# >>> Aventus environment >>>\nold command\n# <<< Aventus environment <<<\nafter\n');
    await initEnvironnment(join(root, 'extension'));
    for (let attempt = 0; attempt < 100 && !readFileSync(zshrc, 'utf8').includes("if [ -f '"); attempt++) {
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    const content = readFileSync(zshrc, 'utf8');
    assert.match(content, /^before\n/);
    assert.match(content, /after\n$/);
    assert.doesNotMatch(content, /old command/);
    assert.equal(content.match(/# >>> Aventus environment >>>/g)?.length, 1);
    assert.equal(content.match(/# <<< Aventus environment <<</g)?.length, 1);
    assert.match(content, /\.aventus-env/);
});

test('Unix installer uses the POSIX profile for an unrecognized shell', async t => {
    const root = mkdtempSync(join(process.cwd(), 'aventus-posix-env-'));
    const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    const originalHome = process.env.HOME;
    const originalShell = process.env.SHELL;
    t.after(() => {
        Object.defineProperty(process, 'platform', originalPlatform);
        if (originalHome === undefined) delete process.env.HOME;
        else process.env.HOME = originalHome;
        if (originalShell === undefined) delete process.env.SHELL;
        else process.env.SHELL = originalShell;
        rmSync(root, { recursive: true, force: true });
    });
    Object.defineProperty(process, 'platform', { ...originalPlatform, value: 'linux' });
    process.env.HOME = root;
    process.env.SHELL = '/bin/sh';
    await initEnvironnment(join(root, 'extension'));
    const profile = join(root, '.profile');
    await waitForFile(profile, '# <<< Aventus environment <<<');
    assert.match(readFileSync(profile, 'utf8'), /\.aventus-env/);
    assert.equal(existsSync(join(root, '.bashrc')), false);
    assert.equal(existsSync(join(root, '.zshrc')), false);
});
