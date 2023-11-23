import { SelectItem } from '../IConnection';
import { AskSelect } from '../notification/AskSelect';



export class ReceiveSelect {
	static cmd: string = "aventus.receiveselect";
	public static run(uuid: string, response: SelectItem | null) {
		AskSelect.resolve(uuid, response);
	}

}
