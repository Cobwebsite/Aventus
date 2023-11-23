import { SelectItem } from '../IConnection';
import { AskSelectMultiple } from '../notification/AskSelectMultiple';



export class ReceiveSelectMultiple {
	static cmd: string = "aventus.receiveselectmultiple";
	public static run(uuid: string, response: SelectItem[] | null) {
		AskSelectMultiple.resolve(uuid, response);
	}

}
