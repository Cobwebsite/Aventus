import { window } from 'vscode';

export class CreateProperty {
	static cmd: string = "aventus.wc.create.property";

	public static async middleware(args: any[]): Promise<any[]> {
		let result: (string | number | boolean)[] = [];
		let prefillName = "";
		if (window.activeTextEditor) {
			let uri = "";
			if (args.length > 0) {
				if (args[0].toString().startsWith("prefill:")) {
					prefillName = args[0].toString().replace("prefill:", "");
					uri = window.activeTextEditor.document.uri.toString();
				}
				else {
					uri = args[0].toString();
				}
			}
			else {
				// use command with key binding
				uri = window.activeTextEditor.document.uri.toString();
			}
			if (uri != "") {
				result.push(uri);
				let activeEditor = window.activeTextEditor;
				let document = activeEditor.document;
				let curPos = activeEditor.selection.active;
				result.push(document.offsetAt(curPos));
				result.push(prefillName);
			}
		}
		return result;
	}
}