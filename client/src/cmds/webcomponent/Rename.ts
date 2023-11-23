import { window } from 'vscode';

export class Rename {
	static cmd: string = "aventus.component.rename";

	public static async middleware(args: any[]): Promise<any[]> {
		return [args[0].toString()];
	}
}