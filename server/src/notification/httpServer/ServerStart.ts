import { ClientConnection } from '../../Connection';

export class ServerStart {

	public static send(ip: string, port: number) {
		ClientConnection.getInstance().sendNotification("aventus/server/start", "http://" + ip + ":" + port);
	}
}