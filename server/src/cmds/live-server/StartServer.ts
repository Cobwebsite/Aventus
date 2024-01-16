import { HttpServer } from '../../live-server/HttpServer';


export class StartServer {
	static cmd: string = "aventus.liveserver.start";

	public static run() {
		HttpServer.getInstance().start();
	}
}