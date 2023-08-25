import { commands } from "vscode";

export class ReceiveInput {
	static cmd: string = "aventus.receiveinput";

	public static async middleware(args: any[]): Promise<any[]> {
		return args;
	}

	public static execute(uuid:string, input: string | null) {
		commands.executeCommand(this.cmd, uuid, input);
	}
}