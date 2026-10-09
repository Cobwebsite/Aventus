import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModule } from './helpers/load-ts.mjs';

const { Storie } = await loadServerModule('project/storybook/Stories.ts');

test('Storybook dispatches each parsed declaration with the file only for classes', async () => {
    const story = new Storie({}, { stories: { output: 'unused' } });
    const calls = [];
    story.writeStory = async (info, file) => calls.push([info.name, file?.name]);
    const file = {
        name: 'component',
        fileParsed: {
            classes: { Card: { name: 'Card' } },
            aliases: { Size: { name: 'Size' } },
            enums: { Tone: { name: 'Tone' } },
            functions: { create: { name: 'create' } },
            variables: { defaultSize: { name: 'defaultSize' } },
        },
    };
    await story.write({ 'file:///card.wcl.avt': file, 'file:///unparsed.ts': { fileParsed: null } });
    assert.deepEqual(calls, [
        ['Card', 'component'], ['Size', undefined], ['Tone', undefined],
        ['create', undefined], ['defaultSize', undefined],
    ]);
});

test('Storybook completes queued writes before resolving', async () => {
    const story = new Storie({}, { stories: { output: 'unused' } });
    const order = [];
    story.writeStory = async info => {
        order.push(`${info.name}:start`);
        await Promise.resolve();
        order.push(`${info.name}:end`);
    };
    await story.write({ 'file:///one.ts': {
        fileParsed: {
            classes: { A: { name: 'A' }, B: { name: 'B' } },
            aliases: {}, enums: {}, functions: {}, variables: {},
        },
    } });
    assert.deepEqual(order, ['A:start', 'A:end', 'B:start', 'B:end']);
});
