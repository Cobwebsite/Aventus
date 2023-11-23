import { GenericServer } from '../../GenericServer';

export class ServerStop {

	public static send() {
		GenericServer.sendNotification("aventus/server/stop", {});
	}
}