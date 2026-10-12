import { GenericServer } from '../GenericServer';
import { v4 as randomUUID } from 'uuid';
import { SelectItem, SelectOptions } from '../IConnection';


export class AskSelect {
	private static waitingResponse: { [uuid: string]: (response: SelectItem | null) => void } = {}
	private static waitingOptions: { [uuid: string]: SelectItem[] } = {}
	private static waitingOptionIds: { [uuid: string]: string[] } = {}
	public static send(items: SelectItem[], options?: SelectOptions) {
		return new Promise<SelectItem | null>((resolve) => {
			let uuid = randomUUID();
			while (this.waitingResponse[uuid] != undefined) {
				uuid = randomUUID();
			}
			this.waitingOptions[uuid] = items;
			const optionIds = items.map((_, index) => `${uuid}:${index}`);
			this.waitingOptionIds[uuid] = optionIds;
			this.waitingResponse[uuid] = (response: SelectItem | null) => {
				resolve(response);
			};
			GenericServer.sendNotification("aventus/askselect", uuid, items.map((item, index) => ({ ...item, id: optionIds[index] })), options);
		})
	}

	public static resolve(uuid: string, response: SelectItem | null) {
		if (this.waitingResponse[uuid]) {
			if (response) {
				const options = this.waitingOptions[uuid];
				const index = this.waitingOptionIds[uuid].indexOf(response.id ?? '');
				if (index >= 0) {
					response = options[index];
				}
				else if (!response.id) {
					// Accept older clients only when their label identifies one option.
					const matches = options.filter(option => option.label === response!.label);
					response = matches.length === 1 ? matches[0] : matches.length > 1 ? null : response;
				}
			}
			this.waitingResponse[uuid](response);
			delete this.waitingResponse[uuid];
			delete this.waitingOptions[uuid];
			delete this.waitingOptionIds[uuid];
		}
	}
}
