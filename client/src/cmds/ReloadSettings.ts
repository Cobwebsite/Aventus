import { commands } from "vscode";

export class ReloadSettings {
	static cmd: string = "aventus.reloadSettings";

	public static async middleware(args: any[]): Promise<any[]> {
		return args;
	}

	public static execute() {
		commands.executeCommand(this.cmd);
	}
}