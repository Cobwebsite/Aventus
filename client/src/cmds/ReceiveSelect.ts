import { commands } from 'vscode';
import { SelectItem } from '../notification/AskSelect';

export class ReceiveSelect {
	static cmd: string = "aventus.receiveselect";

	public static async middleware(args: any[]): Promise<any[]> {
		return args;
	}

	public static execute(uuid:string, item: SelectItem | null) {
		commands.executeCommand(this.cmd, uuid, item);
	}
}