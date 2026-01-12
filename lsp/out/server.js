"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GenericServer_1 = require("../../server/out/GenericServer");
const GenericConnection_1 = require("./GenericConnection");
let i = 0;
process.on('uncaughtException', function (error, origin) {
    GenericServer_1.GenericServer.debug(error.stack);
    console.error(error.stack);
    i++;
    if (error.message) {
        GenericServer_1.GenericServer.showErrorMessage(error.message);
    }
    if (i > 10) {
        process.exit();
    }
});
let server = new GenericServer_1.GenericServer(new GenericConnection_1.GenericConnection());
server.start();
//# sourceMappingURL=server.js.map