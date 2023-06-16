import { ExecuteCommandParams } from 'vscode-languageserver';
import { HttpServer } from '../../live-server/HttpServer';


export class StartServer {
	static cmd: string = "aventus.liveserver.start";
	constructor(params: ExecuteCommandParams) {
		HttpServer.getInstance().start();
	}
}