import { commands, window } from 'vscode';

export class AddConfigSection {
	static cmd: string = "aventus.setBasicInfo";

	public static async middleware(args: any[]): Promise<any[]> {
		return args;
	}

	public static execute(uri: string) {
		commands.executeCommand(this.cmd, uri);
	}
}