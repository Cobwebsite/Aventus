import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ Commands }, { GenericServer }, { FilesManager }, { InternalAventusFile }] = await loadServerModules([
    'cmds/index.ts', 'GenericServer.ts', 'files/FilesManager.ts', 'files/AventusFile.ts',
]);

async function withPrompts(inputAnswers, selectAnswers, run) {
    const previousServer = GenericServer.instance;
    const previousFiles = FilesManager.instance;
    const events = [];
    let reads = 0;
    GenericServer.instance = {
        logLevel: 4,
        connection: {
            Input: async options => { events.push(['input', options.title]); return inputAnswers.shift(); },
            Select: async (items, options) => { events.push(['select', options.title]); return selectAnswers.shift(); },
            sendNotification: (...args) => events.push(['notification', ...args]),
        },
    };
    FilesManager.instance = { getByUri: () => { reads++; return undefined; } };
    try {
        await run(events, () => reads);
    } finally {
        GenericServer.instance = previousServer;
        FilesManager.instance = previousFiles;
    }
}

test('property creation stops independently at name, type and callback cancellation', async () => {
    const uri = 'file:///Button.wcl.avt';
    const command = Commands.allCommandes['aventus.wc.create.property'];
    for (const [inputs, selects, expected] of [
        [[null], [], ['input']],
        [['title'], [null], ['input', 'select']],
        [['title'], [{ label: 'String', detail: 'string' }, null], ['input', 'select', 'select']],
    ]) {
        await withPrompts(inputs, selects, async (events, reads) => {
            await command.run(uri, 0, 'title');
            assert.deepEqual(events.map(event => event[0]), expected);
            assert.equal(reads(), 0);
        });
    }
});

test('watch creation stops at each canceled prompt without opening or editing a file', async () => {
    const uri = 'file:///Button.wcl.avt';
    const command = Commands.allCommandes['aventus.wc.create.watch'];
    for (const [inputs, selects, expected] of [
        [[null], [], ['input']],
        [['status', null], [], ['input', 'input']],
        [['status', 'number'], [null], ['input', 'input', 'select']],
    ]) {
        await withPrompts(inputs, selects, async (events, reads) => {
            await command.run(uri, 0, 'status');
            assert.deepEqual(events.map(event => event[0]), expected);
            assert.equal(reads(), 0);
        });
    }
});

test('CSS variable creation accepts a canceled optional default as an empty fallback', async () => {
    const uri = 'file:///Button.wcs.avt';
    const file = new InternalAventusFile(TextDocument.create(uri, 'scss', 1, '_'));
    const previousServer = GenericServer.instance;
    const previousFiles = FilesManager.instance;
    const events = [];
    const answers = ['PrimaryColor', null];
    GenericServer.instance = {
        logLevel: 4,
        connection: {
            Input: async () => answers.shift(),
            sendNotification: (...args) => events.push(args),
        },
    };
    FilesManager.instance = { getByUri: () => file };
    try {
        await Commands.allCommandes['aventus.wc.create.cssvar'].run(uri, 0);
        assert.equal(file.contentUser, '--_button-primary-color: var(--button-primary-color);');
        assert.equal(events[0][0], 'aventus/editFile');
    } finally {
        clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        FilesManager.instance = previousFiles;
    }
});

test('CSS variable creation preserves the initial lowercase camelCase segment', async () => {
    const uri = 'file:///Button.wcs.avt';
    const file = new InternalAventusFile(TextDocument.create(uri, 'scss', 1, '_'));
    const previousServer = GenericServer.instance;
    const previousFiles = FilesManager.instance;
    const answers = ['primaryColor', null];
    GenericServer.instance = {
        logLevel: 4,
        connection: {
            Input: async () => answers.shift(),
            sendNotification: () => {},
        },
    };
    FilesManager.instance = { getByUri: () => file };
    try {
        await Commands.allCommandes['aventus.wc.create.cssvar'].run(uri, 0);
        assert.equal(file.contentUser, '--_button-primary-color: var(--button-primary-color);');
    } finally {
        clearTimeout(file.delayValidate);
        GenericServer.instance = previousServer;
        FilesManager.instance = previousFiles;
    }
});
