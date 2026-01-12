import { GenericServer } from '@server/GenericServer'
import { GenericConnection } from './GenericConnection'

let i = 0;
process.on('uncaughtException', function (error, origin) {
	GenericServer.debug(error.stack);
	console.error(error.stack);
	i++;
	if (error.message) {
		GenericServer.showErrorMessage(error.message);
	}
	if (i > 10) {
		process.exit();
	}
});


let server = new GenericServer(new GenericConnection());
server.start();