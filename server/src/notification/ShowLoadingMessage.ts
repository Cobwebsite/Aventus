import { GenericServer } from '../GenericServer';
import { v4 as randomUUID } from 'uuid';
import { LoadingMessageOptions } from '../IConnection';

export class ShowLoadingMessage {
	private static waitingResponse: string[] = []
	public static send(options: LoadingMessageOptions) {
		let uuid = randomUUID();
		while (this.waitingResponse.includes(uuid)) {
			uuid = randomUUID();
		}
		this.waitingResponse.push(uuid);
		GenericServer.sendNotification("aventus/show_loading_message", uuid, options);
		return uuid;
	}

	public static done(uuid: string) {
		const index = this.waitingResponse.indexOf(uuid)
		if (index >= 0) {
			this.waitingResponse.splice(index, 1);
			GenericServer.sendNotification("aventus/hide_loading_message", uuid);
		}
	}
}