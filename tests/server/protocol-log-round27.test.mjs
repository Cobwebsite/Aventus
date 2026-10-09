import assert from 'node:assert/strict';
import test from 'node:test';
import { loadServerModules } from './helpers/load-ts.mjs';

const [{ GenericServer }, { SettingsManager }, { LogLevel }] = await loadServerModules([
    'GenericServer.ts', 'settings/Settings.ts', 'settings/LogLevel.ts',
]);

test('server log level changes take effect immediately for debug, information and warnings', () => {
    const previousServer = GenericServer.instance;
    const previousSettings = SettingsManager.instance;
    const previousConsole = console.log;
    const settings = { logLevel: LogLevel.Warning };
    const lines = [];
    GenericServer.instance = Object.create(GenericServer.prototype);
    GenericServer.instance._logFile = undefined;
    SettingsManager.instance = { settings };
    console.log = line => lines.push(line);
    try {
        GenericServer.debug('debug-hidden');
        GenericServer.information('info-hidden');
        GenericServer.warning('warning-visible');
        settings.logLevel = LogLevel.Debug;
        GenericServer.debug('debug-visible');
        settings.logLevel = LogLevel.None;
        GenericServer.warning('warning-hidden');
        GenericServer.error('error-explicit');
        assert.deepEqual(lines, ['warning-visible', 'debug-visible', 'error-explicit']);
    } finally {
        console.log = previousConsole;
        SettingsManager.instance = previousSettings;
        GenericServer.instance = previousServer;
    }
});
