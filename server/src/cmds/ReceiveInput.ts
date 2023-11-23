import { AskInput } from '../notification/AskInput';



export class ReceiveInput {
	static cmd: string = "aventus.receiveinput";
	public static run(uuid: string, response: string | null) {
		AskInput.resolve(uuid, response);
	}

}
