import { GenericServer } from '../GenericServer';
import { v4 as randomUUID } from 'uuid';



export class Popup {
	private static waitingResponse: { [uuid: string]: (response: string | null) => void } = {}
	public static send(text: string, ...choices: string[]) {
		return new Promise<string | null>((resolve) => {
			let uuid = randomUUID();
			while (this.waitingResponse[uuid] != undefined) {
				uuid = randomUUID();
			}
			this.waitingResponse[uuid] = (response: string | null) => {
				resolve(response);
			};
			GenericServer.sendNotification("aventus/popup", uuid, text, choices);
		})
	}

	public static resolve(uuid: string, response: string | null) {
		if (this.waitingResponse[uuid]) {
			this.waitingResponse[uuid](response);
			delete this.waitingResponse[uuid];
		}
	}
}