import { ClientConnection } from '../Connection';

export class UnregisterBuild {

	public static send(pathConfig: string, buildName: string) {
		ClientConnection.getInstance().sendNotification("aventus/unregisterBuild", {
			pathConfig,
			buildName
		});
	}
}