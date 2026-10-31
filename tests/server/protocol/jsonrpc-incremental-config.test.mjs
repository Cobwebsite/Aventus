import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const esbuild = createRequire(import.meta.url)('esbuild');

test('real LSP applies incremental config edits and republishes diagnostics for the newest version', { timeout: 30_000 }, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'aventus-incremental-config-'));
    const config = join(dir, 'aventus.conf.avt');
    const uri = pathToFileURL(config).href;
    const invalid = '{"module":}';
    writeFileSync(config, invalid);
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
        const diagnosticForConfig = message => message.method === 'textDocument/publishDiagnostics'
            && decodeURIComponent(message.params.uri).toLowerCase() === decodeURIComponent(uri).toLowerCase();

        send({ id: 1, method: 'initialize', params: {
            processId: process.pid, rootUri: pathToFileURL(dir).href,
            workspaceFolders: [{ uri: pathToFileURL(dir).href, name: 'incremental' }],
            capabilities: { workspace: { configuration: true } },
            initializationOptions: { savePath: dir, extensionPath: root },
        } });
        const initialized = await next(message => message.id === 1);
        assert.equal(initialized.error, undefined);
        assert.equal(initialized.result.capabilities.textDocumentSync, 2);
        send({ method: 'initialized', params: {} });
        const settings = await next(message => message.method === 'workspace/configuration');
        send({ id: settings.id, result: [{ loadFiles: true, watchFiles: false, useTemplates: false, useCompilators: false }] });
        const html = await next(message => message.method === 'workspace/configuration');
        send({ id: html.id, result: [{ customData: [] }] });
        const initial = await next(message => diagnosticForConfig(message) && message.params.diagnostics.length > 0);
        assert.ok(initial.params.diagnostics.some(item => item.severity === 1));
        await next(message => message.method === 'aventus/initStep' && message.params?.[0]?.[0] === 'Aventus : Done');

        send({ method: 'textDocument/didOpen', params: {
            textDocument: { uri, languageId: 'Aventus Config', version: 1, text: invalid },
        } });
        // Insert the missing JSON value and build section before the closing brace.
        send({ method: 'textDocument/didChange', params: {
            textDocument: { uri, version: 2 },
            contentChanges: [{ range: { start: { line: 0, character: 10 }, end: { line: 0, character: 10 } },
                text: '"Demo","build":[{"src":[]}]' }],
        } });
        const cleared = await next(message => diagnosticForConfig(message) && message.params.diagnostics.length === 0);
        assert.deepEqual(cleared.params.diagnostics, []);

        // Removing only the module value leaves the rest of the edited buffer in place.
        send({ method: 'textDocument/didChange', params: {
            textDocument: { uri, version: 3 },
            contentChanges: [{ range: { start: { line: 0, character: 10 }, end: { line: 0, character: 16 } }, text: '' }],
        } });
        const invalidAgain = await next(message => diagnosticForConfig(message) && message.params.diagnostics.length > 0);
        assert.ok(invalidAgain.params.diagnostics.some(item => item.severity === 1));
        assert.ok(invalidAgain.params.diagnostics.every(item => item.range?.start && item.range?.end));
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
