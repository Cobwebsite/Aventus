import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(import.meta.url);
const esbuild = require('esbuild');

test('server entry point exchanges framed JSON-RPC initialize and hover messages over stdio', { timeout: 15_000 }, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'aventus-lsp-'));
    const entry = join(dir, 'server.cjs');
    let child;
    try {
        const bundle = await esbuild.build({
            entryPoints: [resolve(projectRoot, 'server/src/server.ts')], bundle: true,
            platform: 'node', format: 'cjs', packages: 'external', write: false,
        });
        writeFileSync(entry, bundle.outputFiles[0].text);
        child = spawn(process.execPath, [entry, '--stdio'], {
            cwd: projectRoot, windowsHide: true,
            env: { ...process.env, NODE_PATH: resolve(projectRoot, 'node_modules') },
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        const responses = new Map();
        let buffer = Buffer.alloc(0);
        let stderr = '';
        child.stderr.on('data', chunk => { stderr += chunk.toString(); });
        child.stdout.on('data', chunk => {
            buffer = Buffer.concat([buffer, chunk]);
            while (true) {
                const separator = buffer.indexOf('\r\n\r\n');
                if (separator < 0) return;
                const header = buffer.subarray(0, separator).toString();
                const length = Number(/Content-Length:\s*(\d+)/i.exec(header)?.[1]);
                if (!Number.isFinite(length) || buffer.length < separator + 4 + length) return;
                const payload = JSON.parse(buffer.subarray(separator + 4, separator + 4 + length).toString());
                buffer = buffer.subarray(separator + 4 + length);
                responses.get(payload.id)?.(payload);
            }
        });
        const send = message => {
            const body = Buffer.from(JSON.stringify(message));
            child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
            child.stdin.write(body);
        };
        const request = message => new Promise((resolveResponse, reject) => {
            const timer = setTimeout(() => reject(Error(`JSON-RPC response ${message.id} timed out: ${stderr}`)), 8_000);
            responses.set(message.id, response => {
                clearTimeout(timer);
                responses.delete(message.id);
                resolveResponse(response);
            });
            send({ jsonrpc: '2.0', ...message });
        });
        const initialized = await request({
            id: 1, method: 'initialize', params: {
                processId: process.pid,
                rootUri: null,
                workspaceFolders: [],
                capabilities: {},
                initializationOptions: { savePath: dir, extensionPath: projectRoot },
            },
        });
        assert.equal(initialized.error, undefined);
        assert.equal(initialized.result.capabilities.textDocumentSync, 2);
        assert.equal(initialized.result.capabilities.renameProvider, true);
        const hover = await request({
            id: 2, method: 'textDocument/hover', params: {
                textDocument: { uri: 'file:///missing.wcl.avt' }, position: { line: 0, character: 0 },
            },
        });
        assert.equal(hover.error, undefined);
        assert.equal(hover.result, null);
        const documentUri = 'file:///virtual.wcl.avt';
        send({ jsonrpc: '2.0', method: 'textDocument/didOpen', params: {
            textDocument: { uri: documentUri, languageId: 'Aventus Ts', version: 1, text: 'class First {}' },
        } });
        send({ jsonrpc: '2.0', method: 'textDocument/didChange', params: {
            textDocument: { uri: documentUri, version: 2 },
            contentChanges: [{ text: 'class Second {}' }],
        } });
        send({ jsonrpc: '2.0', method: 'textDocument/didClose', params: {
            textDocument: { uri: documentUri },
        } });
        const afterClose = await request({
            id: 3, method: 'textDocument/hover', params: {
                textDocument: { uri: documentUri }, position: { line: 0, character: 0 },
            },
        });
        assert.equal(afterClose.error, undefined);
        assert.equal(afterClose.result, null);
    } finally {
        if (child) {
            child.kill();
            await new Promise(resolveClose => child.once('close', resolveClose));
        }
        rmSync(dir, { recursive: true, force: true });
    }
});
