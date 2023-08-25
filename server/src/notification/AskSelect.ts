import { GenericServer } from '../GenericServer';
import { v4 as randomUUID } from 'uuid';
import { SelectItem, SelectOptions } from '../IConnection';


export class AskSelect {
	private static waitingResponse: { [uuid: string]: (response: SelectItem | null) => void } = {}
	private static waitingOptions: { [uuid: string]: SelectItem[] } = {}
	public static send(items: SelectItem[], options?: SelectOptions) {
		return new Promise<SelectItem | null>((resolve) => {
			let uuid = randomUUID();
			while (this.waitingResponse[uuid] != undefined) {
				uuid = randomUUID();
			}
			this.waitingOptions[uuid] = items;
			this.waitingResponse[uuid] = (response: SelectItem | null) => {
				resolve(response);
			};
			GenericServer.sendNotification("aventus/askselect", uuid, items, options);
		})
	}

	public static resolve(uuid: string, response: SelectItem | null) {
		if (this.waitingResponse[uuid]) {
			if (response) {
				for (let option of this.waitingOptions[uuid]) {
					if (option.label == response.label) {
						response = option;
					}
				}
			}
			this.waitingResponse[uuid](response);
			delete this.waitingResponse[uuid];
			delete this.waitingOptions[uuid];
		}
	}
}