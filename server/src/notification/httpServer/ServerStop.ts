import { ClientConnection } from '../../Connection';

export class ServerStop {

	public static send() {
		ClientConnection.getInstance().sendNotification("aventus/server/stop", {});
	}
}