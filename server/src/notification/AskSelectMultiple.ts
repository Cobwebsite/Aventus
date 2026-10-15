import { GenericServer } from '../GenericServer';
import { v4 as randomUUID } from 'uuid';
import { SelectItem, SelectOptions } from '../IConnection';

export class AskSelectMultiple {
	private static waitingResponse: { [uuid: string]: (response: SelectItem[] | null) => void } = {}
	private static waitingOptions: { [uuid: string]: SelectItem[] } = {}
	private static waitingOptionIds: { [uuid: string]: string[] } = {}
	public static send(items: SelectItem[], options?: SelectOptions) {
		return new Promise<SelectItem[] | null>((resolve) => {
			let uuid = randomUUID();
			while (this.waitingResponse[uuid] != undefined) {
				uuid = randomUUID();
			}
			this.waitingOptions[uuid] = items;
			const optionIds = items.map((_, index) => `${uuid}:${index}`);
			this.waitingOptionIds[uuid] = optionIds;
			this.waitingResponse[uuid] = (response: SelectItem[] | null) => {
				resolve(response);
			};
			try {
				GenericServer.sendNotification("aventus/askselectmultiple", uuid, items.map((item, index) => ({ ...item, id: optionIds[index] })), options);
			} catch {
				delete this.waitingResponse[uuid];
				delete this.waitingOptions[uuid];
				delete this.waitingOptionIds[uuid];
				resolve(null);
			}
		})
	}

	public static resolve(uuid: string, response: SelectItem[] | null) {
		if (this.waitingResponse[uuid]) {
			if (response) {
				const options = this.waitingOptions[uuid];
				const ids = this.waitingOptionIds[uuid];
				const selected: SelectItem[] = [];
				for (const item of response) {
					let index = ids.indexOf(item.id ?? '');
					if (index < 0 && !item.id) {
						const matches: number[] = []
						for (let i = 0; i < options.length; i++) {
							const option = options[i];
							if (option.label === item.label && option.detail === item.detail) {
								matches.push(i);
							}
						}
						if (matches.length === 1) index = matches[0];
					}
					if (index < 0) {
						response = null;
						break;
					}
					selected.push(options[index]);
				}
				if (response) response = selected;
			}
			this.waitingResponse[uuid](response);
			delete this.waitingResponse[uuid];
			delete this.waitingOptions[uuid];
			delete this.waitingOptionIds[uuid];
		}
	}
}
