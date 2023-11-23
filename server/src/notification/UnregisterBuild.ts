import { GenericServer } from '../GenericServer';

export class UnregisterBuild {

	public static send(pathConfig: string, buildName: string) {
		GenericServer.sendNotification("aventus/unregisterBuild", {
			pathConfig,
			buildName
		});
	}
}