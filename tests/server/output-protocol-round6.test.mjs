import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ HttpServer }, { SettingsManager }, { GenericServer }, { Storie }] =
    await loadServerModules([
        'live-server/HttpServer.ts', 'settings/Settings.ts', 'GenericServer.ts',
        'project/storybook/Stories.ts',
    ]);

test('live server broadcasts updates to connected clients and stops the socket on shutdown', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-output-http-'));
    writeFileSync(join(root, 'index.html'), '<html><body>Ready</body></html>');
    const oldSettings = SettingsManager.instance;
    const oldServer = GenericServer.instance;
    SettingsManager.instance = { settings: { liveserver: {
        host: '127.0.0.1', port: 0, autoIncrementPort: false, rootFolder: root,
        indexFile: 'index.html', delay: 5, launch_browser: false, auto_close: false,
    } } };
    GenericServer.instance = { connection: { sendNotification() {}, showInformationMessage() {} }, logLevel: 99 };
    const server = Object.create(HttpServer.prototype);
    let socket;
    try {
        await server.start();
        if (!server.server.listening) await once(server.server, 'listening');
        const port = server.server.address().port;
        const manual = await fetch(`http://127.0.0.1:${port}/?get_injected_code`);
        assert.equal(manual.status, 200);
        assert.equal(manual.headers.get('access-control-allow-origin'), '*');
        assert.match(await manual.text(), new RegExp(`ws://127\\.0\\.0\\.1:${port}/ws`));
        socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
        await once(socket, 'open');

        const cssMessage = once(socket, 'message');
        server.updateCSS('.card{color:red}', 'demo-card', ['child-card']);
        assert.deepEqual(JSON.parse((await cssMessage)[0].toString()), {
            cmd: 'update_css', params: { css: '.card{color:red}', element: 'demo-card', children: ['child-card'] },
        });

        const reloadMessage = once(socket, 'message');
        server.reload();
        assert.deepEqual(JSON.parse((await reloadMessage)[0].toString()), { cmd: 'reload', params: {} });

        const closed = once(socket, 'close');
        server.stop();
        await closed;
        assert.equal(socket.readyState, WebSocket.CLOSED);
    } finally {
        server.stop();
        socket?.terminate();
        SettingsManager.instance = oldSettings;
        GenericServer.instance = oldServer;
        rmSync(root, { recursive: true, force: true });
    }
});

test('Storybook write traverses all declaration kinds and skips entries without story content', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-output-storybook-'));
    try {
        const story = new Storie({}, { stories: { output: root } });
        const written = new Map();
        story.writeFile = async (path, content) => { written.set(path, content); };
        const declaration = (name, kind) => ({
            name, fullName: `Demo.${name}`,
            build: { buildConfig: { stories: {} } },
            storieContent: { kind, namespace: 'Demo' },
            documentation: { definitions: [`Documentation for ${name}`] },
        });
        const file = { fileParsed: {
            classes: { Card: declaration('Card', 'class') },
            aliases: { Theme: declaration('Theme', 'alias') },
            enums: { Shade: declaration('Shade', 'enum') },
            functions: { render: declaration('render', 'function') },
            variables: { ignored: { name: 'ignored', fullName: 'Demo.ignored' } },
        } };
        await story.write({ 'file:///demo.ts': file, 'file:///unparsed.ts': {} }, true);
        assert.equal(written.size, 8);
        for (const name of ['Card', 'Theme', 'Shade', 'render']) {
            const source = [...written.entries()].find(([path]) => path.endsWith(`${name}.stories.ts`))?.[1];
            assert.ok(source, name);
            assert.match(source, new RegExp(`Documentation for ${name}`));
        }
        assert.equal([...written.keys()].some(path => path.includes('ignored')), false);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
