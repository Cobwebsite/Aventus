import { GenericServer } from '../GenericServer';
import { InitStep } from './InitStep';

export class Compiled {

	public static send(buildName: string) {
		if (InitStep.isInit) {
			GenericServer.sendNotification("aventus/compiled", buildName);
		}
	}
}