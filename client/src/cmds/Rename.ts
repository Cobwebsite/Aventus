import { Uri, commands, window } from "vscode";

export class Rename {
    static cmd: string = "aventus.rename";

    public static async middleware(args: any[]): Promise<any[]> {
        return args;
    }

	public static execute(data: readonly {
		readonly oldUri: Uri;
		readonly newUri: Uri;
	}[]) {
		commands.executeCommand(this.cmd, data);
	}
}