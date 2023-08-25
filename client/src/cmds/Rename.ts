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
		let formattedData: { oldUri: string, newUri: string }[] = [];
		for(let item of data){
			formattedData.push({
				oldUri: item.oldUri.toString(),
				newUri: item.oldUri.toString(),
			})
		}
		commands.executeCommand(this.cmd, formattedData);
	}
}