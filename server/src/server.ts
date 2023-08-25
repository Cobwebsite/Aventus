import { GenericServer } from './GenericServer';
import { VsCodeConnection } from './vscode/Connection';

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


let server = new GenericServer(new VsCodeConnection());
server.start();