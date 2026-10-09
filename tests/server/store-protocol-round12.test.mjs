import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Store, QueryError }, { GenericServer }, { DependencyManager }] = await loadServerModules([
    'store/Store.ts', 'GenericServer.ts', 'project/DependencyManager.ts',
]);

test('Store sends multipart bodies without a JSON content type and includes the bearer token', async () => {
    const oldFetch = globalThis.fetch;
    const oldSettings = Store._settings;
    let request;
    Store._settings = { token: 'sample-token', username: 'dev' };
    globalThis.fetch = async (...args) => {
        request = args;
        return { status: 200, text: async () => '{"errors":[],"result":true}' };
    };
    try {
        const form = new FormData();
        form.append('name', 'Example');
        assert.equal(await Store.postWithErrors('/template/publish', form), true);
        assert.equal(request[0], `${Store.url}/api/remote/template/publish`);
        assert.equal(request[1].method, 'POST');
        assert.equal(request[1].body, form);
        assert.equal(request[1].headers['Content-Type'], undefined);
        assert.match(request[1].headers.Authorization, /^Bearer sample-token\|.+/);
    } finally {
        globalThis.fetch = oldFetch;
        Store._settings = oldSettings;
    }
});

test('Store reports invalid JSON without leaking a thrown parser error', async () => {
    const oldFetch = globalThis.fetch;
    const oldServer = GenericServer.instance;
    const oldLog = console.log;
    const errors = [];
    GenericServer.instance = { logLevel: 4, connection: {} };
    console.log = message => errors.push(message);
    globalThis.fetch = async () => ({ status: 200, text: async () => '<html>service down</html>' });
    try {
        const result = await Store.postWithErrors('/login', {}, { withoutBearer: true });
        assert.ok(result instanceof QueryError);
        assert.equal(result.errors[0].code, -500);
        assert.match(result.errors[0].message, /SyntaxError/);
        assert.deepEqual(errors, ['<html>service down</html>']);
    } finally {
        globalThis.fetch = oldFetch;
        GenericServer.instance = oldServer;
        console.log = oldLog;
    }
});

test('Store cleans the template archive after an API rejection', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-rejected-'));
    const folder = join(root, 'template');
    mkdirSync(folder);
    mkdirSync(join(root, 'temp'));
    const config = join(folder, 'template.avt.ts');
    writeFileSync(config, 'export class Template {}');
    const oldServer = GenericServer.instance;
    const oldPost = Store.postWithErrors;
    GenericServer.instance = { _savePath: root };
    Store.postWithErrors = async () => new QueryError([{ code: 409, message: 'Exists' }]);
    try {
        const result = await Store.publishTemplate({
            config, folderPath: folder, name: 'Starter', description: 'Demo',
            version: '1.0.0', isProject: true, isGlobal: false, tags: [],
        });
        assert.ok(result instanceof QueryError);
        assert.equal(result.errors[0].code, 409);
        assert.equal(existsSync(join(root, 'temp', 'Starter.zip')), false);
    } finally {
        Store.postWithErrors = oldPost;
        GenericServer.instance = oldServer;
        rmSync(root, { recursive: true, force: true });
    }
});

test('Store includes optional package metadata and repeated tags in its publication form', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aventus-store-package-metadata-'));
    const output = join(root, 'output');
    mkdirSync(join(output, '@locals'), { recursive: true });
    writeFileSync(join(output, '@locals', 'Demo.package.avt'), 'export namespace Demo {}');
    const oldDependencies = DependencyManager.getInstance;
    const oldPost = Store.postWithErrors;
    let form;
    DependencyManager.getInstance = () => ({ getPath: () => output });
    Store.postWithErrors = async (uri, submitted) => {
        assert.equal(uri, '/package/publish');
        form = submitted;
        return true;
    };
    try {
        const build = {
            buildConfig: {
                fullname: 'Demo', version: '2.3.4', description: 'Reusable widgets',
                organization: 'Widgets', documentation: 'https://example.test/docs',
                repository: 'https://example.test/source', tags: ['ui', 'widgets'],
            },
            project: { getConfigFile: () => ({ folderPath: root }) },
        };
        assert.equal(await Store.publishPackage(build), true);
        assert.equal(form.get('description'), 'Reusable widgets');
        assert.equal(form.get('organization'), 'Widgets');
        assert.equal(form.get('documentation'), 'https://example.test/docs');
        assert.equal(form.get('repository'), 'https://example.test/source');
        assert.deepEqual(form.getAll('tags[]'), ['ui', 'widgets']);
        assert.equal(form.get('readMe'), null);
    } finally {
        DependencyManager.getInstance = oldDependencies;
        Store.postWithErrors = oldPost;
        rmSync(root, { recursive: true, force: true });
    }
});
