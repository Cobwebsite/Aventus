import { commands } from "vscode";

export class PopupResponse {
	static cmd: string = "aventus.popupresponse";

	public static async middleware(args: any[]): Promise<any[]> {
		return args;
	}

	public static execute(uuid:string, input: string | null) {
		commands.executeCommand(this.cmd, uuid, input);
	}
}