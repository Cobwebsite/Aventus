import { ExecuteCommandParams } from 'vscode-languageserver';
import { HttpServer } from '../../live-server/HttpServer';


export class ToggleServer {
	static cmd: string = "aventus.liveserver.toggle";
	constructor(params: ExecuteCommandParams) {
		HttpServer.getInstance().toggle();
	}
}