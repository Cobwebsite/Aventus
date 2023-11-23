import { randomUUID } from 'crypto';
import { GenericServer } from '../GenericServer';

export class Loading {
	private static inProgress: string[] = [];

	public static send(text: string) {
		let uuid = randomUUID();
		while (this.inProgress.includes(uuid)) {
			uuid = randomUUID();
		}
		GenericServer.sendNotification("aventus/start_loading", uuid, text);
		return (finalMsg: string = "", delay: number = 0) => {
			GenericServer.sendNotification("aventus/stop_loading", uuid, finalMsg, delay);
		}
	}
}