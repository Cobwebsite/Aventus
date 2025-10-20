import { window } from 'vscode';


export class StorePublishTemplate {
	static cmd: string = "aventus.store.publish_template";

	public static async middleware(args: any[]): Promise<any[]> {
		let result: string[] = []
		if (args.length > 0) {
			result.push(args[0].toString());
		}
		return result;
	}
}