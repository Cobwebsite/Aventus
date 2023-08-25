import { GenericServer } from '../GenericServer';
import { v4 as randomUUID } from 'uuid';
import { SelectItem, SelectOptions } from '../IConnection';

export class AskSelectMultiple {
	private static waitingResponse: { [uuid: string]: (response: SelectItem[] | null) => void } = {}
	public static send(items: SelectItem[], options?: SelectOptions) {
		return new Promise<SelectItem[] | null>((resolve) => {
			let uuid = randomUUID();
			while (this.waitingResponse[uuid] != undefined) {
				uuid = randomUUID();
			}
			this.waitingResponse[uuid] = (response: SelectItem[] | null) => {
				resolve(response);
			};
			GenericServer.sendNotification("aventus/askselectmultiple", uuid, items, options);
		})
	}

	public static resolve(uuid: string, response: SelectItem[] | null) {
		if (this.waitingResponse[uuid]) {
			this.waitingResponse[uuid](response);
			delete this.waitingResponse[uuid];
		}
	}
}