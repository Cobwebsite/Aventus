import { GenericServer } from '../GenericServer';
import { InitStep } from './InitStep';

export class Compiled {

	public static send(buildName: string) {
		GenericServer.sendNotification("aventus/compiled", buildName);
	}

	public static part(info: string) {
		GenericServer.sendNotification("aventus/compiled/part", info);
	}
}