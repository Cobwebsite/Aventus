import { v4 as randomUUID } from 'uuid';
import { GenericServer } from '../GenericServer';

export class ProgressStart {

	public static send(text: string): string {
		let uuid = randomUUID();
		GenericServer.sendNotification("aventus/progress_start", uuid, text);
		return uuid;
	}
}