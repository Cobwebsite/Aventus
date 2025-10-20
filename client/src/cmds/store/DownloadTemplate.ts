import { commands } from 'vscode';


export class StoreDownloadTemplate {
	static cmd: string = "aventus.store.download_template";

	public static async middleware(args: any[]): Promise<any[]> {
		return args;
	}

	public static execute(url: string) {
		commands.executeCommand(this.cmd, url);
	}
}