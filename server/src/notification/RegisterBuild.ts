import { ClientConnection } from '../Connection';

export class RegisterBuild {

	public static send(pathConfig: string, buildName: string) {
		ClientConnection.getInstance().sendNotification("aventus/registerBuild", {
			pathConfig,
			buildName
		});
	}
}