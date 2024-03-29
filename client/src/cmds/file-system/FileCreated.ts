import { commands } from 'vscode';

export class FileCreated {
	static cmd: string = "aventus.filesystem.created";

	public static async middleware(args: any[]): Promise<any[]> {
		return [args[0].toString()];
	}

	public static execute(uri: string) {
		commands.executeCommand(this.cmd, uri);
	}
}