import { GenericServer } from '../../GenericServer';

export class ServerStart {

	public static send(ip: string, port: number) {
		GenericServer.sendNotification("aventus/server/start", "http://" + ip + ":" + port);
	}
}