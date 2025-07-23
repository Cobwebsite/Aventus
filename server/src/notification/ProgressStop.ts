import { v4 as randomUUID } from 'uuid';
import { GenericServer } from '../GenericServer';

export class ProgressStop {

	public static send(uuid: string): void {
		GenericServer.sendNotification("aventus/progress_stop", uuid);
	}
}