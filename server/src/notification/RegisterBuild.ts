import { GenericServer } from '../GenericServer';

export class RegisterBuild {

	public static send(pathConfig: string, buildName: string) {
		GenericServer.sendNotification("aventus/registerBuild", {
			pathConfig,
			buildName
		});
	}
}