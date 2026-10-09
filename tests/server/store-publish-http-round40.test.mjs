import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Store, QueryError }, { StorePublishTemplate }, { TemplateScript }, { GenericServer }] = await loadServerModules([
    'store/Store.ts', 'cmds/store/PublishTemplate.ts', 'files/Template.ts', 'GenericServer.ts',
]);

test('publish command sends template metadata and a real ZIP to local HTTP, then removes its temporary archive', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-publish-http-'));
    const folder = join(root, 'template');
    mkdirSync(folder, { recursive: true });
    mkdirSync(join(root, 'temp'));
    const config = join(folder, 'template.avt.ts');
    writeFileSync(config, 'template configuration');
    writeFileSync(join(folder, 'README.md'), 'Template documentation');
    writeFileSync(join(folder, 'content.txt'), 'Published content');
    const received = [];
    const server = createServer(async (request, response) => {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const body = Buffer.concat(chunks);
        const data = await new Request('http://localhost/', {
            method: 'POST', headers: { 'content-type': request.headers['content-type'] }, body,
        }).formData();
        const archive = data.get('templateFile');
        received.push({
            path: request.url,
            authorization: request.headers.authorization,
            fields: [...data.entries()].filter(([, value]) => typeof value === 'string'),
            readme: await data.get('readMe').text(),
            archiveName: archive.name,
            archiveType: archive.type,
            archiveBytes: Buffer.from(await archive.arrayBuffer()),
        });
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ errors: [], result: true }));
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const prior = { url: Store.url, settings: Store._settings, instance: GenericServer.instance, create: TemplateScript.create };
    const messages = [];
    Store.url = `http://127.0.0.1:${server.address().port}`;
    Store._settings = { token: 'local-token', username: 'alice' };
    GenericServer.instance = { _savePath: root, connection: {
        showInformationMessage: message => messages.push(message),
        showErrorMessage: message => messages.push(`error:${message}`),
    } };
    TemplateScript.create = async path => {
        assert.equal(path.replaceAll('\\', '/'), config.replaceAll('\\', '/'));
        return {
            name: 'sample', description: 'A test template', version: '2.3.4',
            isProject: false, isGlobal: true, organization: 'Aventus',
            documentation: 'https://example.test/docs', repository: 'https://example.test/repo',
            tags: ['forms', 'web'], folderPath: folder, config,
        };
    };
    t.after(async () => {
        Store.url = prior.url;
        Store._settings = prior.settings;
        GenericServer.instance = prior.instance;
        TemplateScript.create = prior.create;
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
        rmSync(root, { recursive: true, force: true });
    });

    await StorePublishTemplate.run(new URL(`file:///${config.replaceAll('\\', '/')}`).href);
    assert.deepEqual(messages, ['Template published']);
    assert.equal(received.length, 1);
    assert.equal(received[0].path, '/api/remote/template/publish');
    assert.match(received[0].authorization, /^Bearer local-token\|.+/);
    assert.deepEqual(received[0].fields, [
        ['name', 'sample'], ['description', 'A test template'], ['version', '2.3.4'],
        ['is_project', '0'], ['is_global', '1'], ['organization', 'Aventus'],
        ['documentation', 'https://example.test/docs'], ['repository', 'https://example.test/repo'],
        ['tags[]', 'forms'], ['tags[]', 'web'],
    ]);
    assert.equal(received[0].readme, 'Template documentation');
    assert.equal(received[0].archiveName, 'sample.zip');
    assert.equal(received[0].archiveType, 'application/zip');
    assert.deepEqual(received[0].archiveBytes.subarray(0, 2), Buffer.from('PK'));
    assert.equal(existsSync(join(root, 'temp', 'sample.zip')), false);
});

test('Store returns all validation errors from local HTTP and removes the generated template archive', async t => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-publish-rejected-'));
    const folder = join(root, 'template');
    mkdirSync(folder, { recursive: true });
    mkdirSync(join(root, 'temp'));
    writeFileSync(join(folder, 'template.avt.ts'), 'template');
    const server = createServer(async (request, response) => {
        for await (const _ of request) { /* consume uploaded archive */ }
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ errors: [
            { code: 409, message: 'Version exists' },
            { code: 422, message: 'Invalid tag' },
        ] }));
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const prior = { url: Store.url, settings: Store._settings, instance: GenericServer.instance };
    Store.url = `http://127.0.0.1:${server.address().port}`;
    Store._settings = { token: 'local-token', username: 'alice' };
    GenericServer.instance = { _savePath: root };
    t.after(async () => {
        Store.url = prior.url;
        Store._settings = prior.settings;
        GenericServer.instance = prior.instance;
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
        rmSync(root, { recursive: true, force: true });
    });

    const result = await Store.publishTemplate({
        name: 'sample', description: '', version: '1.0.0', isProject: false, isGlobal: false,
        tags: [], folderPath: folder, config: join(folder, 'template.avt.ts'),
    });
    assert.ok(result instanceof QueryError);
    assert.deepEqual(result.errors, [
        { code: 409, message: 'Version exists' },
        { code: 422, message: 'Invalid tag' },
    ]);
    assert.equal(existsSync(join(root, 'temp', 'sample.zip')), false);
});
