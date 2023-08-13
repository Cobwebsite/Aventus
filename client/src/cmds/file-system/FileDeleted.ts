import { commands } from 'vscode';

export class FileDeleted {
	static cmd: string = "aventus.filesystem.deleted";

	public static async middleware(args: any[]): Promise<any[]> {
		return [args[0].toString()];
	}

	public static execute(uri: string) {
		commands.executeCommand(this.cmd, uri);
	}
}