import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
            }, 15_000);
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
            && decodeURIComponent(message.params.uri).toLowerCase() === decodeURIComponent(configUri).toLowerCase()
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

test('real LSP workspace discovers a configured TypeScript source and writes its build output', { timeout: 30_000 }, async () => {
    const lsp = await startServer();
    try {
        mkdirSync(join(lsp.dir, 'src'));
        const configPath = join(lsp.dir, 'aventus.conf.avt');
        const sourcePath = join(lsp.dir, 'src', 'greeter.lib.avt');
        const outputPath = join(lsp.dir, 'dist', 'app.js');
        writeFileSync(configPath, JSON.stringify({
            module: 'Demo', build: [{ name: 'web', src: ['./src'],
                compile: [{ output: './dist/app.js' }] }],
        }));
        writeFileSync(sourcePath, 'export class Greeter {}');
        const initialized = lsp.next(message => message.id === 20);
        lsp.send({ id: 20, method: 'initialize', params: {
            processId: process.pid, rootUri: pathToFileURL(lsp.dir).href,
            workspaceFolders: [{ uri: pathToFileURL(lsp.dir).href, name: 'fixture' }],
            capabilities: { workspace: { configuration: true } },
            initializationOptions: { savePath: lsp.dir, extensionPath: root },
        } });
        assert.equal((await initialized).error, undefined);
        lsp.send({ method: 'initialized', params: {} });
        const settings = await lsp.next(message => message.method === 'workspace/configuration');
        lsp.send({ id: settings.id, result: [{
            loadFiles: true, watchFiles: false, useTemplates: false, useCompilators: true,
        }] });
        const html = await lsp.next(message => message.method === 'workspace/configuration');
        lsp.send({ id: html.id, result: [{ customData: [] }] });
        const compiled = await lsp.next(message => message.method === 'aventus/compiled'
            && message.params?.[0]?.[0] === 'Demo@web');
        assert.ok(compiled);
        assert.match(readFileSync(outputPath, 'utf8'), /Greeter/);
    } finally {
        await lsp.close();
    }
});

test('real LSP project compiles a component view and SCSS, then refreshes CSS after an edit', { timeout: 30_000 }, async () => {
    const lsp = await startServer();
    try {
        mkdirSync(join(lsp.dir, 'src'));
        const outputPath = join(lsp.dir, 'dist', 'app.js');
        const stylePath = join(lsp.dir, 'src', 'card.wcs.avt');
        const viewPath = join(lsp.dir, 'src', 'card.wcv.avt');
        const logicPath = join(lsp.dir, 'src', 'card.wcl.avt');
        writeFileSync(join(lsp.dir, 'aventus.conf.avt'), JSON.stringify({
            module: 'Demo', build: [{ name: 'web', src: ['./src'],
                compile: [{ output: './dist/app.js' }] }],
        }));
        writeFileSync(logicPath,
            '@TagName("demo-card") export class Card extends Aventus.WebComponent implements Aventus.DefaultComponent { public submit() {} public cancel() {} }');
        writeFileSync(viewPath, '<button class="card" @click="submit">Hello</button>');
        writeFileSync(stylePath, '$tone: red; .card { color: $tone; }');
        const initialized = lsp.next(message => message.id === 30);
        lsp.send({ id: 30, method: 'initialize', params: {
            processId: process.pid, rootUri: pathToFileURL(lsp.dir).href,
            workspaceFolders: [{ uri: pathToFileURL(lsp.dir).href, name: 'fixture' }],
            capabilities: { workspace: { configuration: true } },
            initializationOptions: { savePath: lsp.dir, extensionPath: root },
        } });
        assert.equal((await initialized).error, undefined);
        lsp.send({ method: 'initialized', params: {} });
        const settings = await lsp.next(message => message.method === 'workspace/configuration');
        lsp.send({ id: settings.id, result: [{
            loadFiles: true, watchFiles: false, useTemplates: false, useCompilators: true,
        }] });
        const html = await lsp.next(message => message.method === 'workspace/configuration');
        lsp.send({ id: html.id, result: [{ customData: [] }] });
        await lsp.next(message => message.method === 'aventus/compiled'
            && message.params?.[0]?.[0] === 'Demo@web');
        // Use the URI registered during workspace discovery for later document notifications.
        const styleUri = (await lsp.next(message => message.method === 'textDocument/publishDiagnostics'
            && decodeURIComponent(message.params.uri).toLowerCase() ===
                decodeURIComponent(pathToFileURL(stylePath).href).toLowerCase())).params.uri;
        const viewUri = (await lsp.next(message => message.method === 'textDocument/publishDiagnostics'
            && decodeURIComponent(message.params.uri).toLowerCase() ===
                decodeURIComponent(pathToFileURL(viewPath).href).toLowerCase())).params.uri;
        const first = readFileSync(outputPath, 'utf8');
        assert.match(first, /Card/);
        assert.match(first, /color:red/);
        assert.match(first, /Hello/);

        const definitionFor = async (id, method, offset) => {
            const response = lsp.next(message => message.id === id);
            lsp.send({ id, method: 'textDocument/definition', params: {
                textDocument: { uri: viewUri }, position: { line: 0, character: offset },
            } });
            const result = (await response).result;
            const locations = Array.isArray(result) ? result : [result];
            const logicText = readFileSync(logicPath, 'utf8');
            const declaration = logicText.indexOf(`public ${method}(`) + 'public '.length;
            assert.ok(declaration >= 'public '.length);
            assert.ok(locations.some(location => location &&
                decodeURIComponent(location.uri).toLowerCase() ===
                    decodeURIComponent(pathToFileURL(logicPath).href).toLowerCase() &&
                location.range.start.line === 0 &&
                location.range.start.character === declaration), JSON.stringify(result));
        };
        lsp.send({ method: 'textDocument/didOpen', params: { textDocument: {
            uri: viewUri, languageId: 'Aventus HTML', version: 1,
            text: '<button class="card" @click="submit">Hello</button>',
        } } });
        await definitionFor(31, 'submit', '<button class="card" @click="submit">Hello</button>'.indexOf('submit') + 2);
        lsp.send({ method: 'textDocument/didChange', params: {
            textDocument: { uri: viewUri, version: 2 },
            contentChanges: [{ text: '<button class="card" @click="cancel">Hello</button>' }],
        } });
        await new Promise(resolve => setTimeout(resolve, 700));
        await definitionFor(32, 'cancel', '<button class="card" @click="cancel">Hello</button>'.indexOf('cancel') + 2);

        lsp.send({ method: 'textDocument/didOpen', params: { textDocument: {
            uri: styleUri, languageId: 'Aventus SCSS', version: 1,
            text: '$tone: red; .card { color: $tone; }',
        } } });
        lsp.send({ method: 'textDocument/didChange', params: {
            textDocument: { uri: styleUri, version: 2 },
            contentChanges: [{ text: '$tone: blue; .card { color: $tone; }' }],
        } });
        await new Promise(resolve => setTimeout(resolve, 700));
        const compiled = lsp.next(message => message.method === 'aventus/compiled'
            && message.params?.[0]?.[0] === 'Demo@web');
        lsp.send({ method: 'textDocument/didSave', params: { textDocument: { uri: styleUri } } });
        await compiled;
        const updated = readFileSync(outputPath, 'utf8');
        assert.match(updated, /color:blue/);
        assert.doesNotMatch(updated, /color:red/);
    } finally {
        await lsp.close();
    }
});

test('real LSP resolves a TypeScript import across files and updates diagnostics after edits', { timeout: 30_000 }, async () => {
    const lsp = await startServer();
    try {
        mkdirSync(join(lsp.dir, 'src'));
        const basePath = join(lsp.dir, 'src', 'base.lib.avt');
        const ownerPath = join(lsp.dir, 'src', 'owner.lib.avt');
        const valid = 'import { Parent } from "./base.lib.avt";\nexport class Child extends Parent {}';
        const invalid = valid.replace('{ Parent }', '{ Missing }').replace('extends Parent', 'extends Missing');
        writeFileSync(join(lsp.dir, 'aventus.conf.avt'), JSON.stringify({
            module: 'Demo', build: [{ name: 'web', src: ['./src'] }],
        }));
        writeFileSync(basePath, 'export class Parent {}');
        writeFileSync(ownerPath, valid);

        const initialized = lsp.next(message => message.id === 40);
        lsp.send({ id: 40, method: 'initialize', params: {
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
        await lsp.next(message => message.method === 'aventus/initStep'
            && message.params?.[0]?.[0] === 'Aventus : Done');

        const ownerPublished = await lsp.next(message => message.method === 'textDocument/publishDiagnostics'
            && decodeURIComponent(message.params.uri).toLowerCase() ===
                decodeURIComponent(pathToFileURL(ownerPath).href).toLowerCase());
        const ownerUri = ownerPublished.params.uri;
        assert.deepEqual(ownerPublished.params.diagnostics, []);
        const baseUri = pathToFileURL(basePath).href;
        lsp.send({ method: 'textDocument/didOpen', params: { textDocument: {
            uri: ownerUri, languageId: 'Aventus Ts', version: 1, text: valid,
        } } });
        const definition = lsp.next(message => message.id === 41);
        lsp.send({ id: 41, method: 'textDocument/definition', params: {
            textDocument: { uri: ownerUri }, position: { line: 1, character: 29 },
        } });
        const definitionResult = (await definition).result;
        assert.ok((Array.isArray(definitionResult) ? definitionResult : [definitionResult]).some(location =>
            decodeURIComponent(location.uri).toLowerCase() === decodeURIComponent(baseUri).toLowerCase()),
        JSON.stringify(definitionResult));

        lsp.send({ method: 'textDocument/didChange', params: {
            textDocument: { uri: ownerUri, version: 2 }, contentChanges: [{ text: invalid }],
        } });
        const broken = await lsp.next(message => message.method === 'textDocument/publishDiagnostics'
            && decodeURIComponent(message.params.uri).toLowerCase() === decodeURIComponent(ownerUri).toLowerCase()
            && message.params.diagnostics.some(item => item.severity === 1));
        assert.ok(broken.params.diagnostics.some(item => /Missing/.test(item.message)));

        lsp.send({ method: 'textDocument/didChange', params: {
            textDocument: { uri: ownerUri, version: 3 }, contentChanges: [{ text: valid }],
        } });
        const restored = await lsp.next(message => message.method === 'textDocument/publishDiagnostics'
            && decodeURIComponent(message.params.uri).toLowerCase() === decodeURIComponent(ownerUri).toLowerCase()
            && message.params.diagnostics.length === 0);
        assert.deepEqual(restored.params.diagnostics, []);
    } finally {
        await lsp.close();
    }
});

test('real LSP publishes and clears HTML and SCSS diagnostics in a component project', { timeout: 40_000 }, async () => {
    const lsp = await startServer();
    try {
        mkdirSync(join(lsp.dir, 'src'));
        const viewPath = join(lsp.dir, 'src', 'card.wcv.avt');
        const stylePath = join(lsp.dir, 'src', 'card.wcs.avt');
        const validView = '<div><span>Ready</span></div>';
        const validStyle = '.card { color: red; }';
        writeFileSync(join(lsp.dir, 'aventus.conf.avt'), JSON.stringify({
            module: 'Demo', build: [{ name: 'web', src: ['./src'] }],
        }));
        writeFileSync(join(lsp.dir, 'src', 'card.wcl.avt'),
            '@TagName("demo-card") export class Card extends Aventus.WebComponent implements Aventus.DefaultComponent {}');
        writeFileSync(viewPath, validView);
        writeFileSync(stylePath, validStyle);

        const initialized = lsp.next(message => message.id === 50);
        lsp.send({ id: 50, method: 'initialize', params: {
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
        await lsp.next(message => message.method === 'aventus/initStep'
            && message.params?.[0]?.[0] === 'Aventus : Done');

        for (const [path, languageId, valid, broken] of [
            [viewPath, 'Aventus HTML', validView, '<div><span>Ready</div>'],
            [stylePath, 'Aventus SCSS', validStyle, '.card { color: ; }'],
        ]) {
            const published = await lsp.next(message => message.method === 'textDocument/publishDiagnostics'
                && decodeURIComponent(message.params.uri).toLowerCase() ===
                    decodeURIComponent(pathToFileURL(path).href).toLowerCase());
            const uri = published.params.uri;
            lsp.send({ method: 'textDocument/didOpen', params: { textDocument: {
                uri, languageId, version: 1, text: valid,
            } } });
            lsp.send({ method: 'textDocument/didChange', params: {
                textDocument: { uri, version: 2 }, contentChanges: [{ text: broken }],
            } });
            const diagnostic = await lsp.next(message => message.method === 'textDocument/publishDiagnostics'
                && message.params.uri === uri
                && message.params.diagnostics.some(item => item.severity === 1));
            assert.ok(diagnostic.params.diagnostics.every(item => item.range?.start && item.range?.end));
            lsp.send({ method: 'textDocument/didChange', params: {
                textDocument: { uri, version: 3 }, contentChanges: [{ text: valid }],
            } });
            const cleared = await lsp.next(message => message.method === 'textDocument/publishDiagnostics'
                && message.params.uri === uri && message.params.diagnostics.length === 0);
            assert.deepEqual(cleared.params.diagnostics, []);
        }
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
