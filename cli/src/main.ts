#!/usr/bin/env node
import { GenericServer } from '@server/GenericServer'
import { CliConnection } from './Connection';
import { printLogo } from './logo';

printLogo();

let i = 0;
process.on('uncaughtException', function (error) {
    console.error(error.stack);
    i++;
    if (error.message) {
        GenericServer.showErrorMessage(error.message);
    }
    if (i > 10) {
        process.exit();
    }
});


let server = new GenericServer(new CliConnection());
server.start();