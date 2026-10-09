import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const esbuild = createRequire(import.meta.url)('esbuild');

async function startServer() {
    const dir = mkdtempSync(join(tmpdir(), 'aventus-jsonrpc-round8-'));
    const bundle = await esbuild.build({
        entryPoints: [resolve(root, 'server/src/server.ts')], bundle: true,
        platform: 'node', format: 'cjs', packages: 'external', write: false,
        define: { __APP_VERSION__: '"1.3.7"' },
    });
    const entry = join(dir, 'server.cjs');
    writeFileSync(entry, bundle.outputFiles[0].text);
    const child = spawn(process.execPath, [entry, '--stdio'], {
        cwd: root, windowsHide: true,
        env: { ...process.env, NODE_PATH: resolve(root, 'node_modules') },
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    const messages = [];
    const waiting = [];
    let buffer = Buffer.alloc(0);
    let stderr = '';
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
            } else {
                messages.push(message);
            }
        }
    });
    function send(message) {
        const body = Buffer.from(JSON.stringify({ jsonrpc: '2.0', ...message }));
        child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
        child.stdin.write(body);
    }
    function next(predicate) {
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
    }
    async function close() {
        if (child.exitCode === null) {
            const closed = new Promise(resolveClose => child.once('close', resolveClose));
            child.kill();
            await closed;
        }
        for (const waiter of waiting) clearTimeout(waiter.timer);
        rmSync(dir, { recursive: true, force: true });
    }
    return { dir, child, send, next, close };
}

test('real LSP process loads both configuration sections, reloads them, and shuts down cleanly', { timeout: 30_000 }, async () => {
    const lsp = await startServer();
    try {
        const init = lsp.next(message => message.id === 1);
        lsp.send({ id: 1, method: 'initialize', params: {
            processId: process.pid, rootUri: pathToFileURL(lsp.dir).href,
            workspaceFolders: [{ uri: pathToFileURL(lsp.dir).href, name: 'fixture' }],
            capabilities: { workspace: { configuration: true } },
            initializationOptions: { savePath: lsp.dir, extensionPath: root },
        } });
        assert.equal((await init).result.capabilities.textDocumentSync, 2);

        lsp.send({ method: 'initialized', params: {} });
        const configuration = await lsp.next(message => message.method === 'workspace/configuration');
        assert.deepEqual(configuration.params.items.map(item => item.section), ['aventus']);
        lsp.send({ id: configuration.id, result: [{
            loadFiles: false, watchFiles: false, useTemplates: false, useCompilators: false,
        }] });
        const html = await lsp.next(message => message.method === 'workspace/configuration');
        assert.deepEqual(html.params.items.map(item => item.section), ['html']);
        lsp.send({ id: html.id, result: [{ customData: [] }] });
        const done = await lsp.next(message => message.method === 'aventus/initStep');
        assert.deepEqual(done.params, [['Aventus : Done']]);

        lsp.send({ method: 'workspace/didChangeConfiguration', params: { settings: {} } });
        const reloaded = await lsp.next(message => message.method === 'workspace/configuration');
        assert.deepEqual(reloaded.params.items.map(item => item.section), ['aventus']);
        lsp.send({ id: reloaded.id, result: [{
            loadFiles: false, watchFiles: false, useTemplates: false, useCompilators: false,
        }] });
        const reloadedHtml = await lsp.next(message => message.method === 'workspace/configuration');
        assert.deepEqual(reloadedHtml.params.items.map(item => item.section), ['html']);
        lsp.send({ id: reloadedHtml.id, result: [{ customData: [] }] });

        const uri = 'file:///round8-virtual.wcl.avt';
        lsp.send({ method: 'textDocument/didOpen', params: {
            textDocument: { uri, languageId: 'Aventus Ts', version: 1, text: 'class Before {}' },
        } });
        lsp.send({ method: 'textDocument/didChange', params: {
            textDocument: { uri, version: 2 }, contentChanges: [{ text: 'class After {}' }],
        } });
        const completion = lsp.next(message => message.id === 3);
        lsp.send({ id: 3, method: 'textDocument/completion', params: {
            textDocument: { uri }, position: { line: 0, character: 1 },
        } });
        assert.deepEqual((await completion).result, { isIncomplete: false, items: [] });
        const formatting = lsp.next(message => message.id === 4);
        lsp.send({ id: 4, method: 'textDocument/formatting', params: {
            textDocument: { uri }, options: { tabSize: 4, insertSpaces: true },
        } });
        assert.deepEqual((await formatting).result, []);
        lsp.send({ method: 'textDocument/didClose', params: { textDocument: { uri } } });
        const hover = lsp.next(message => message.id === 5);
        lsp.send({ id: 5, method: 'textDocument/hover', params: {
            textDocument: { uri }, position: { line: 0, character: 1 },
        } });
        assert.equal((await hover).result, null);

        const shutdown = lsp.next(message => message.id === 2);
        lsp.send({ id: 2, method: 'shutdown', params: null });
        assert.equal((await shutdown).result, null);
        const exited = new Promise(resolveExit => lsp.child.once('close', resolveExit));
        lsp.send({ method: 'exit', params: null });
        assert.equal(await exited, 0);
    } finally {
        await lsp.close();
    }
});

test('real LSP process publishes JSON diagnostics for an invalid workspace config', { timeout: 30_000 }, async () => {
    const lsp = await startServer();
    try {
        const configPath = join(lsp.dir, 'aventus.conf.avt');
        writeFileSync(configPath, '{"module":}');
        const configUri = pathToFileURL(configPath).href;
        const initialized = lsp.next(message => message.id === 10);
        lsp.send({ id: 10, method: 'initialize', params: {
            processId: process.pid, rootUri: pathToFileURL(lsp.dir).href,
            workspaceFolders: [{ uri: pathToFileURL(lsp.dir).href, name: 'fixture' }],
            capabilities: { workspace: { configuration: true } },
            initializationOptions: { savePath: lsp.dir, extensionPath: root },
        } });
        assert.equal((await initialized).error, undefined);
        lsp.send({ method: 'initialized', params: {} });
        const settings = await lsp.next(message => message.method === 'workspace/configuration');
        lsp.send({ id: settings.id, result: [{
            loadFiles: true, watchFiles: false, useTemplates: false, useCompilators: false,
        }] });
        const html = await lsp.next(message => message.method === 'workspace/configuration');
        lsp.send({ id: html.id, result: [{ customData: [] }] });
        const diagnostic = await lsp.next(message => message.method === 'textDocument/publishDiagnostics'
            && decodeURIComponent(message.params.uri).toLowerCase() === configUri.toLowerCase()
            && message.params.diagnostics.length > 0);
        assert.ok(diagnostic.params.diagnostics.some(item => item.severity === 1));
        assert.ok(diagnostic.params.diagnostics.every(item => item.range?.start && item.range?.end));
        const done = await lsp.next(message => message.method === 'aventus/initStep'
            && message.params?.[0]?.[0] === 'Aventus : Done');
        assert.ok(done);
        lsp.send({ method: 'textDocument/didOpen', params: {
            textDocument: { uri: diagnostic.params.uri, languageId: 'Aventus Config', version: 1, text: '{"module":}' },
        } });
        lsp.send({ method: 'textDocument/didChange', params: {
            textDocument: { uri: diagnostic.params.uri, version: 2 },
            contentChanges: [{ text: '{"module":"Demo","build":[{"src":[]}]}' }],
        } });
        const cleared = await lsp.next(message => message.method === 'textDocument/publishDiagnostics'
            && message.params.uri === diagnostic.params.uri && message.params.diagnostics.length === 0);
        assert.deepEqual(cleared.params.diagnostics, []);
        const shutdown = lsp.next(message => message.id === 11);
        lsp.send({ id: 11, method: 'shutdown', params: null });
        assert.equal((await shutdown).result, null);
    } finally {
        await lsp.close();
    }
});

test('real LSP process answers every advertised document request for a missing file', { timeout: 30_000 }, async () => {
    const lsp = await startServer();
    try {
        const init = lsp.next(message => message.id === 100);
        lsp.send({ id: 100, method: 'initialize', params: {
            processId: process.pid, rootUri: null, workspaceFolders: [], capabilities: {},
            initializationOptions: { savePath: lsp.dir, extensionPath: root },
        } });
        const capabilities = (await init).result.capabilities;
        for (const name of ['completionProvider', 'hoverProvider', 'definitionProvider',
            'documentFormattingProvider', 'codeActionProvider', 'codeLensProvider',
            'referencesProvider', 'renameProvider', 'colorProvider']) {
            assert.ok(capabilities[name], `${name} must be advertised`);
        }
        const uri = 'file:///round12-missing.wcl.avt';
        const textDocument = { uri };
        const position = { line: 0, character: 0 };
        const range = { start: position, end: position };
        const requests = [
            ['textDocument/completion', { textDocument, position }, null],
            ['textDocument/hover', { textDocument, position }, null],
            ['textDocument/definition', { textDocument, position }, null],
            ['textDocument/references', { textDocument, position, context: { includeDeclaration: true } }, null],
            ['textDocument/rename', { textDocument, position, newName: 'renamed' }, null],
            ['textDocument/formatting', { textDocument, options: { tabSize: 4, insertSpaces: true } }, null],
            ['textDocument/codeAction', { textDocument, range, context: { diagnostics: [] } }, null],
            ['textDocument/codeLens', { textDocument }, null],
            ['textDocument/documentColor', { textDocument }, null],
            ['textDocument/colorPresentation', { textDocument, range, color: { red: 1, green: 0, blue: 0, alpha: 1 } }, null],
            ['completionItem/resolve', { label: 'untouched', data: { uri } }, { label: 'untouched', data: { uri } }],
        ];
        for (const [index, [method, params, expected]] of requests.entries()) {
            const id = 101 + index;
            const response = lsp.next(message => message.id === id);
            lsp.send({ id, method, params });
            const message = await response;
            assert.equal(message.error, undefined, method);
            assert.deepEqual(message.result, expected, method);
        }
    } finally {
        await lsp.close();
    }
});
