import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const esbuild = createRequire(import.meta.url)('esbuild');

test('real LSP session discovers two workspace configs and updates their diagnostics independently', { timeout: 30_000 }, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'aventus-lsp-roots-'));
    let child;
    const waiting = [];
    const messages = [];
    let buffer = Buffer.alloc(0);
    let stderr = '';
    try {
        const first = join(dir, 'first');
        const second = join(dir, 'second');
        mkdirSync(first);
        mkdirSync(second);
        const firstUri = pathToFileURL(join(first, 'aventus.conf.avt')).href;
        const secondUri = pathToFileURL(join(second, 'aventus.conf.avt')).href;
        const invalid = '{"module":}';
        writeFileSync(join(first, 'aventus.conf.avt'), invalid);
        writeFileSync(join(second, 'aventus.conf.avt'), invalid);
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
                const waiter = waiting.find(item => item.predicate(message));
                if (waiter) {
                    waiting.splice(waiting.indexOf(waiter), 1);
                    clearTimeout(waiter.timer);
                    waiter.resolve(message);
                } else messages.push(message);
            }
        });
        const send = message => {
            const body = Buffer.from(JSON.stringify({ jsonrpc: '2.0', ...message }));
            child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
            child.stdin.write(body);
        };
        const next = predicate => {
            const index = messages.findIndex(predicate);
            if (index >= 0) return Promise.resolve(messages.splice(index, 1)[0]);
            return new Promise((resolveMessage, reject) => {
                const waiter = { predicate, resolve: resolveMessage };
                waiter.timer = setTimeout(() => {
                    waiting.splice(waiting.indexOf(waiter), 1);
                    reject(Error(`LSP message timed out: ${stderr}; queued ${JSON.stringify(messages).slice(0, 2000)}`));
                }, 8_000);
                waiting.push(waiter);
            });
        };
        const uriMatches = (actual, expected) => decodeURIComponent(actual).toLowerCase() === decodeURIComponent(expected).toLowerCase();

        const initialized = next(message => message.id === 1);
        send({ id: 1, method: 'initialize', params: {
            processId: process.pid, rootUri: null,
            workspaceFolders: [first, second].map(path => ({ uri: pathToFileURL(path).href, name: path.split(/[\\/]/).at(-1) })),
            capabilities: { workspace: { configuration: true } },
            initializationOptions: { savePath: dir, extensionPath: root },
        } });
        assert.equal((await initialized).error, undefined);
        send({ method: 'initialized', params: {} });
        const settings = await next(message => message.method === 'workspace/configuration');
        assert.deepEqual(settings.params.items.map(item => item.section), ['aventus']);
        send({ id: settings.id, result: [{ loadFiles: true, watchFiles: false, useTemplates: false, useCompilators: false }] });
        const html = await next(message => message.method === 'workspace/configuration');
        assert.deepEqual(html.params.items.map(item => item.section), ['html']);
        send({ id: html.id, result: [{ customData: [] }] });

        for (const uri of [firstUri, secondUri]) {
            const published = await next(message => message.method === 'textDocument/publishDiagnostics'
                && uriMatches(message.params.uri, uri) && message.params.diagnostics.length > 0);
            assert.ok(published.params.diagnostics.some(item => item.severity === 1), uri);
        }
        await next(message => message.method === 'aventus/initStep' && message.params?.[0]?.[0] === 'Aventus : Done');

        send({ method: 'textDocument/didOpen', params: {
            textDocument: { uri: firstUri, languageId: 'Aventus Config', version: 1, text: invalid },
        } });
        send({ method: 'textDocument/didChange', params: {
            textDocument: { uri: firstUri, version: 2 },
            contentChanges: [{ text: '{"module":"First","build":[{"src":[]}]}' }],
        } });
        const cleared = await next(message => message.method === 'textDocument/publishDiagnostics'
            && uriMatches(message.params.uri, firstUri) && message.params.diagnostics.length === 0);
        assert.deepEqual(cleared.params.diagnostics, []);
        send({ method: 'textDocument/didOpen', params: {
            textDocument: { uri: secondUri, languageId: 'Aventus Config', version: 1, text: invalid },
        } });
        send({ method: 'textDocument/didChange', params: {
            textDocument: { uri: secondUri, version: 2 }, contentChanges: [{ text: '{"module":]' }],
        } });
        const stillInvalid = await next(message => message.method === 'textDocument/publishDiagnostics'
            && uriMatches(message.params.uri, secondUri) && message.params.diagnostics.length > 0);
        assert.ok(stillInvalid.params.diagnostics.some(item => item.severity === 1));
    } finally {
        if (child?.exitCode === null) {
            const closed = new Promise(resolveClose => child.once('close', resolveClose));
            child.kill();
            await closed;
        }
        for (const waiter of waiting) clearTimeout(waiter.timer);
        rmSync(dir, { recursive: true, force: true });
    }
});
