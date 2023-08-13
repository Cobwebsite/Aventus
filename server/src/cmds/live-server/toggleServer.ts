import { HttpServer } from '../../live-server/HttpServer';


export class ToggleServer {
	static cmd: string = "aventus.liveserver.toggle";
	
	public static run() {
		HttpServer.getInstance().toggle();
	}
}