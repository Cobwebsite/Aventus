import { commands } from 'vscode';
import { SelectItem } from '../notification/AskSelect';

export class ReceiveSelectMultiple {
	static cmd: string = "aventus.receiveselectmultiple";

	public static async middleware(args: any[]): Promise<any[]> {
		return args;
	}

	public static execute(uuid:string, item: SelectItem[] | null) {
		commands.executeCommand(this.cmd, uuid, item);
	}
}