import { GenericServer } from '../GenericServer';
import { v4 as randomUUID } from 'uuid';
import { InputOptions } from '../IConnection';



export class AskInput {
	private static waitingResponse: { [uuid: string]: (response: string | null) => void } = {}
	public static send(options: InputOptions) {
		return new Promise<string | null>((resolve) => {
			let uuid = randomUUID();
			while (this.waitingResponse[uuid] != undefined) {
				uuid = randomUUID();
			}
			this.waitingResponse[uuid] = (response: string | null) => {
				resolve(response);
			};
			GenericServer.sendNotification("aventus/askinput", uuid, options);
		})
	}

	public static resolve(uuid: string, response: string | null) {
		if (this.waitingResponse[uuid]) {
			this.waitingResponse[uuid](response);
			delete this.waitingResponse[uuid];
		}
	}
}