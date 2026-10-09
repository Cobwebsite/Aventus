import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const paths = [
    'GenericServer.ts', 'notification/RegisterBuild.ts', 'notification/UnregisterBuild.ts',
    'notification/OpenFile.ts', 'notification/CloseFile.ts',
    'notification/httpServer/ServerStart.ts', 'notification/httpServer/ServerStop.ts',
    'notification/httpServer/ServerFileChange.ts', 'notification/ProgressStop.ts',
    'notification/InitStep.ts', 'notification/DebugFileAdd.ts',
    'notification/DebugFileRemove.ts', 'notification/ShowLoadingMessage.ts',
    'notification/sharp/Compiling.ts',
];
const [server, register, unregister, open, close, httpStart, httpStop, httpChange,
    progressStop, initStep, debugAdd, debugRemove, loading, compiling] =
    await loadServerModules(paths);
const { GenericServer } = server;

test('build, file, HTTP and progress notifications use their expected channels and payloads', () => {
    const sent = [];
    const previous = GenericServer.instance;
    GenericServer.instance = { connection: { sendNotification: (...args) => sent.push(args) } };
    try {
        register.RegisterBuild.send('config', 'web');
        unregister.UnregisterBuild.send('config', 'web');
        open.OpenFile.send('file:///app.ts');
        close.CloseFile.send('file:///app.ts');
        httpStart.ServerStart.send('localhost', 8080);
        httpStop.ServerStop.send();
        httpChange.ServerFileChange.send('file:///app.css');
        progressStop.ProgressStop.send('task-1');
        initStep.InitStep.send('Loading');
        initStep.InitStep.sendDone();
        assert.deepEqual(sent, [
            ['aventus/registerBuild', [{ pathConfig: 'config', buildName: 'web' }]],
            ['aventus/unregisterBuild', [{ pathConfig: 'config', buildName: 'web' }]],
            ['aventus/openfile', ['file:///app.ts']],
            ['aventus/closefile', ['file:///app.ts']],
            ['aventus/server/start', ['http://localhost:8080']],
            ['aventus/server/stop', [{}]],
            ['aventus/server/file-change', ['file:///app.css']],
            ['aventus/progress_stop', ['task-1']],
            ['aventus/initStep', ['Loading']],
            ['aventus/initStep', ['Aventus : Done']],
        ]);
        assert.equal(initStep.InitStep.isInit, true);
    } finally {
        GenericServer.instance = previous;
        initStep.InitStep.isInit = false;
    }
});

test('debug, loading and Sharp notifications send their payloads and close once', () => {
    const sent = [];
    const previous = GenericServer.instance;
    GenericServer.instance = { logLevel: 4, connection: { sendNotification: (...args) => sent.push(args) } };
    try {
        debugAdd.DebugFileAdd.send('file:///debug.ts', 'content');
        debugRemove.DebugFileRemove.send('file:///debug.ts');
        const id = loading.ShowLoadingMessage.send({ title: 'Building' });
        loading.ShowLoadingMessage.done(id);
        loading.ShowLoadingMessage.done(id);
        compiling.Compiling.send('app.csproj', 'success');
        assert.deepEqual(sent, [
            ['aventus/addDebugFile', ['file:///debug.ts', 'content']],
            ['aventus/removeDebugFile', ['file:///debug.ts']],
            ['aventus/show_loading_message', [id, { title: 'Building' }]],
            ['aventus/hide_loading_message', [id]],
            ['aventus/sharp/compiling', ['app.csproj', 'success', undefined]],
        ]);
    } finally {
        GenericServer.instance = previous;
    }
});
