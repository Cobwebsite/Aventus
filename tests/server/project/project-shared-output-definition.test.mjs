import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from '../helpers/load-ts.mjs';

const [{ Project }] = await loadServerModules(['project/Project.ts']);

test('component lookup continues to the second build sharing an output when the first has no tag', () => {
    const project = Object.create(Project.prototype);
    const calls = [];
    const output = 'D:/out/shared.package.avt';
    project.builds = [
        {
            outputPathes: [output],
            getLocalWebComponentDefinition(tag) {
                calls.push(['first', tag]);
                return undefined;
            },
        },
        {
            outputPathes: [output],
            getLocalWebComponentDefinition(tag) {
                calls.push(['second', tag]);
                return { tag, source: 'second' };
            },
        },
    ];

    assert.deepEqual(project.getInternalWebComponentDefinition(output, 'x-second'),
        { tag: 'x-second', source: 'second' });
    assert.deepEqual(calls, [['first', 'x-second'], ['second', 'x-second']]);
});

test('first build keeps priority when both builds sharing an output define the tag', () => {
    const project = Object.create(Project.prototype);
    const calls = [];
    const output = 'D:/out/shared.package.avt';
    project.builds = [
        { outputPathes: [output], getLocalWebComponentDefinition(tag) {
            calls.push('first');
            return { tag, source: 'first' };
        } },
        { outputPathes: [output], getLocalWebComponentDefinition(tag) {
            calls.push('second');
            return { tag, source: 'second' };
        } },
    ];

    assert.deepEqual(project.getInternalWebComponentDefinition(output, 'x-shared'),
        { tag: 'x-shared', source: 'first' });
    assert.deepEqual(calls, ['first']);
});

test('component lookup reaches the later build when its output path is distinct', () => {
    const project = Object.create(Project.prototype);
    const calls = [];
    project.builds = [
        { outputPathes: ['D:/out/first.package.avt'], getLocalWebComponentDefinition: () => {
            calls.push('first');
            return undefined;
        } },
        { outputPathes: ['D:/out/second.package.avt'], getLocalWebComponentDefinition: () => {
            calls.push('second');
            return { source: 'second' };
        } },
    ];

    assert.deepEqual(project.getInternalWebComponentDefinition('D:/out/second.package.avt', 'x-second'),
        { source: 'second' });
    assert.deepEqual(calls, ['second']);
});
