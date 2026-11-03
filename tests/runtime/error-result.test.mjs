import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { loadRuntime, loadRuntimeContext } from './helpers/load-runtime.mjs';

test('error results stop subsequent work after the first error', async () => {
    const { GenericError, VoidWithError } = loadRuntime();
    const result = new VoidWithError();
    const failure = new GenericError(12, 'failure');
    let subsequent = 0;
    result.run(() => [failure]).run(() => { subsequent++; return []; });
    await result.runAsync(async () => { subsequent++; return []; });
    assert.equal(result.success, false);
    assert.equal(result.containsCode(12), true);
    assert.equal(result.containsCode(13), false);
    assert.equal(subsequent, 0);
    const copy = result.toGeneric();
    assert.equal(copy.success, false);
    assert.equal(copy.errors[0], failure);
});

test('result extraction propagates errors and preserves a successful value', () => {
    const { GenericError, VoidWithError, ResultWithError } = loadRuntime();
    const outer = new VoidWithError();
    const success = new ResultWithError();
    success.result = 'value';
    assert.equal(outer.extract(() => success), 'value');
    const failure = new ResultWithError();
    failure.errors.push(new GenericError(4, 'missing'));
    assert.equal(outer.extract(() => failure), undefined);
    assert.equal(outer.containsCode(4), true);
    assert.equal(outer.extract(() => success), undefined);
});

test('async result extraction propagates errors and prevents subsequent callbacks', async () => {
    const { GenericError, VoidWithError, ResultWithError } = loadRuntime();
    const outer = new VoidWithError();
    const good = new ResultWithError();
    good.result = 5;
    assert.equal(await outer.extractAsync(async () => good), 5);
    const bad = new ResultWithError();
    bad.errors.push(new GenericError(6, 'invalid'));
    assert.equal(await outer.extractAsync(async () => bad), undefined);
    let calls = 0;
    await outer.runAsync(async () => { calls++; return []; });
    assert.equal(calls, 0);
    assert.equal(outer.containsCode(6), true);
});

test('ResultWithError propagates successful values including falsy ones', async () => {
    const { ResultWithError, VoidWithError } = loadRuntime();
    for(const value of [0, false, '', null, 'value']) {
        const inner = new ResultWithError();
        inner.result = value;
        const outer = new ResultWithError();
        outer.run(() => inner);
        assert.equal(outer.result, value);
        const asyncOuter = new ResultWithError();
        await asyncOuter.runAsync(async () => inner);
        assert.equal(asyncOuter.result, value);
        assert.equal(new VoidWithError().extract(() => inner), value);
        assert.equal(await new VoidWithError().extractAsync(async () => inner), value);
    }
});

test('VoidWithError accumulates multiple errors and filters codes by error subclass', async () => {
    const { GenericError, RamError, RamErrorCode, VoidWithError } = loadRuntime();
    const generic = new GenericError(RamErrorCode.noId, 'generic');
    const ram = new RamError(RamErrorCode.noItemInsideRam, 'ram');
    const result = new VoidWithError();
    result.run(() => [generic, ram]);
    assert.equal(result.success, false);
    assert.equal(result.errors.length, 2);
    assert.equal(result.containsCode(RamErrorCode.noId), true);
    assert.equal(result.containsCode(RamErrorCode.noId, RamError), false);
    assert.equal(result.containsCode(RamErrorCode.noItemInsideRam, RamError), true);
    assert.equal(result.containsCode(RamErrorCode.noItemInsideRam, GenericError), true);
    let called = false;
    await result.runAsync(async () => { called = true; return []; });
    assert.equal(called, false);
});

test('GenericError converts Error messages and ResultWithError preserves errors on generic conversion', () => {
    const context = loadRuntimeContext();
    const { GenericError, ResultWithError } = context.Aventus;
    const failure = new GenericError(7, runInNewContext('new Error("broken")', context));
    assert.equal(failure.code, 7);
    assert.equal(failure.message, 'broken');
    assert.equal(new GenericError(7, new Error('host')).message, 'Error: host');
    const result = new ResultWithError();
    result.result = 'partial';
    result.errors.push(failure, new GenericError(8, 'another'));
    const generic = result.toGeneric();
    assert.notEqual(generic, result);
    assert.equal(generic.success, false);
    assert.equal(generic.result, 'partial');
    assert.equal(generic.errors[0], failure);
    assert.equal(generic.errors.length, 2);
});
