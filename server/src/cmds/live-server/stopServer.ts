import { ExecuteCommandParams } from 'vscode-languageserver';
import { HttpServer } from '../../live-server/HttpServer';


export class StopServer {
	static cmd: string = "aventus.liveserver.stop";
	constructor(params: ExecuteCommandParams) {
		HttpServer.getInstance().stop();
	}
}