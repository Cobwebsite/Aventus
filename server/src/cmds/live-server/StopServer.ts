import { HttpServer } from '../../live-server/HttpServer';


export class StopServer {
	static cmd: string = "aventus.liveserver.stop";
	
	public static run() {
		HttpServer.getInstance().stop();
	}
}