import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import test from 'node:test';

const helperUrl = new URL('./helpers/load-ts.mjs', import.meta.url).href;

async function doesNotReturnAtWhitespace(method, content, offset, search) {
    const worker = new Worker(`
        const { parentPort } = require('node:worker_threads');
        (async () => {
            const { loadServerModule } = await import(${JSON.stringify(helperUrl)});
            const tools = await loadServerModule('tools.ts');
            parentPort.postMessage('ready');
            parentPort.once('message', () => {
                const file = {
                    contentUser: ${JSON.stringify(content)},
                    documentUser: { offsetAt: () => ${offset}, getText: () => ${JSON.stringify(content)} },
                };
                parentPort.postMessage('entered');
                tools[${JSON.stringify(method)}](file, { line: 0, character: ${offset} }, ${JSON.stringify(search)});
                parentPort.postMessage('returned');
            });
        })().catch(error => parentPort.postMessage({ error: String(error) }));
    `, { eval: true });
    try {
        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(Error('worker initialization timed out')), 10_000);
            worker.once('error', reject);
            worker.once('message', message => {
                clearTimeout(timer);
                if (message !== 'ready') reject(Error(JSON.stringify(message)));
                else resolve();
            });
        });
        let returned = false;
        worker.on('message', message => { if (message === 'returned') returned = true; });
        const entered = new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(Error('worker did not enter the search')), 5_000);
            worker.on('message', message => {
                if (message === 'entered') { clearTimeout(timer); resolve(); }
            });
        });
        worker.postMessage('run');
        await entered;
        await new Promise(resolve => setTimeout(resolve, 150));
        return !returned;
    } finally {
        await worker.terminate();
    }
}

test('adjacent whitespace currently traps both text searches without advancing the offset', async () => {
    assert.equal(await doesNotReturnAtWhitespace('checkTxtBefore', 'a b', 3, 'ab'), true);
    assert.equal(await doesNotReturnAtWhitespace('checkTxtAfter', 'a b', 0, 'ab'), true);
});
