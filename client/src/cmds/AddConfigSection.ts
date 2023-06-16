import { window } from 'vscode';

export class AddConfigSection {
	static cmd: string = "aventus.addConfigSection";

	public static async middleware(args: any[]): Promise<any[]> {
		let result: string[] = []
		if (args.length > 0) {
			let uri = args[0].toString();
			result.push(uri);
			const name = await window.showInputBox({
				title: "Provide a name for your config section",
			});
			if (name) {
				result.push(name);
			}
		}
		return result;
	}
}