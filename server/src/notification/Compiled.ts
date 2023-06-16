import { ClientConnection } from '../Connection';
import { InitStep } from './InitStep';

export class Compiled {

	public static send(buildName: string) {
		if (InitStep.isInit) {
			ClientConnection.getInstance().sendNotification("aventus/compiled", buildName);
		}
	}
}