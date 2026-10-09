import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const esbuild = createRequire(import.meta.url)('esbuild');

test('real LSP document cycle validates each buffer, sends save, and clears diagnostics on close', { timeout: 30_000 }, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'aventus-lsp-cycle-'));
    const config = join(dir, 'aventus.conf.avt');
    const uri = pathToFileURL(config).href;
    const initial = '{"module":}';
    const corrected = '{"module":"Cycle","build":[{"src":[]}]}';
    writeFileSync(config, initial);
    let child;
    const queued = [];
    const waiters = [];
    let buffer = Buffer.alloc(0);
    let stderr = '';
    try {
        const bundle = await esbuild.build({
            entryPoints: [resolve(root, 'server/src/server.ts')], bundle: true,
            platform: 'node', format: 'cjs', packages: 'external', write: false,
            define: { __APP_VERSION__: '"1.3.7"' },
        });
        const entry = join(dir, 'server.cjs');
        writeFileSync(entry, bundle.outputFiles[0].text);
        child = spawn(process.execPath, [entry, '--stdio'], {
            cwd: root, windowsHide: true,
            env: { ...process.env, NODE_PATH: resolve(root, 'node_modules') },
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        child.stderr.on('data', chunk => { stderr += chunk.toString(); });
        child.stdout.on('data', chunk => {
            buffer = Buffer.concat([buffer, chunk]);
            while (true) {
                const end = buffer.indexOf('\r\n\r\n');
                if (end < 0) break;
                const length = Number(/Content-Length:\s*(\d+)/i.exec(buffer.subarray(0, end).toString())?.[1]);
                if (!Number.isFinite(length)) throw Error('Invalid LSP frame');
                if (buffer.length < end + 4 + length) break;
                const message = JSON.parse(buffer.subarray(end + 4, end + 4 + length).toString());
                buffer = buffer.subarray(end + 4 + length);
                const waiter = waiters.find(item => item.predicate(message));
                if (waiter) {
                    waiters.splice(waiters.indexOf(waiter), 1);
                    clearTimeout(waiter.timer);
                    waiter.resolve(message);
                } else queued.push(message);
            }
        });
        const send = message => {
            const body = Buffer.from(JSON.stringify({ jsonrpc: '2.0', ...message }));
            child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
            child.stdin.write(body);
        };
        const next = predicate => {
            const found = queued.findIndex(predicate);
            if (found >= 0) return Promise.resolve(queued.splice(found, 1)[0]);
            return new Promise((resolveMessage, reject) => {
                const waiter = { predicate, resolve: resolveMessage };
                waiter.timer = setTimeout(() => {
                    waiters.splice(waiters.indexOf(waiter), 1);
                    reject(Error(`LSP timeout: ${stderr}; queued ${JSON.stringify(queued).slice(0, 2000)}`));
                }, 8_000);
                waiters.push(waiter);
            });
        };
        const isDiagnostics = message => message.method === 'textDocument/publishDiagnostics'
            && decodeURIComponent(message.params.uri).toLowerCase() === decodeURIComponent(uri).toLowerCase();

        const initialized = next(message => message.id === 1);
        send({ id: 1, method: 'initialize', params: {
            processId: process.pid, rootUri: pathToFileURL(dir).href,
            workspaceFolders: [{ uri: pathToFileURL(dir).href, name: 'cycle' }],
            capabilities: { workspace: { configuration: true } },
            initializationOptions: { savePath: dir, extensionPath: root },
        } });
        assert.equal((await initialized).error, undefined);
        send({ method: 'initialized', params: {} });
        const settings = await next(message => message.method === 'workspace/configuration');
        send({ id: settings.id, result: [{ loadFiles: true, watchFiles: false, useTemplates: false, useCompilators: false }] });
        const html = await next(message => message.method === 'workspace/configuration');
        send({ id: html.id, result: [{ customData: [] }] });
        const diskError = await next(message => isDiagnostics(message) && message.params.diagnostics.length > 0);
        assert.ok(diskError.params.diagnostics.some(item => item.severity === 1));
        await next(message => message.method === 'aventus/initStep' && message.params?.[0]?.[0] === 'Aventus : Done');

        send({ method: 'textDocument/didOpen', params: {
            textDocument: { uri, languageId: 'Aventus Config', version: 1, text: initial },
        } });
        send({ method: 'textDocument/didChange', params: {
            textDocument: { uri, version: 2 }, contentChanges: [{ text: corrected }],
        } });
        const clear = await next(message => isDiagnostics(message) && message.params.diagnostics.length === 0);
        assert.deepEqual(clear.params.diagnostics, []);

        send({ method: 'textDocument/didSave', params: { textDocument: { uri }, text: corrected } });
        send({ method: 'textDocument/didChange', params: {
            textDocument: { uri, version: 3 }, contentChanges: [{ text: initial }],
        } });
        const invalidAgain = await next(message => isDiagnostics(message) && message.params.diagnostics.length > 0);
        assert.ok(invalidAgain.params.diagnostics.some(item => item.severity === 1));

        rmSync(config);
        send({ method: 'textDocument/didClose', params: { textDocument: { uri } } });
        const closed = await next(message => isDiagnostics(message) && message.params.diagnostics.length === 0);
        assert.deepEqual(closed.params.diagnostics, []);
        const hover = next(message => message.id === 2);
        send({ id: 2, method: 'textDocument/hover', params: {
            textDocument: { uri }, position: { line: 0, character: 1 },
        } });
        assert.equal((await hover).result, null);
    } finally {
        if (child?.exitCode === null) {
            const closed = new Promise(resolveClose => child.once('close', resolveClose));
            child.kill();
            await closed;
        }
        for (const waiter of waiters) clearTimeout(waiter.timer);
        rmSync(dir, { recursive: true, force: true });
    }
});
