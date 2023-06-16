import { window } from 'vscode';

export class ImportViewElement {
	static cmd: string = "aventus.wc.import.viewElement";

	public static async middleware(args: any[]): Promise<any[]> {
		let result: (string | number)[] = [];
		if (window.activeTextEditor) {
			let uri = "";
			if (args.length > 0) {
				uri = args[0].toString();
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
			}
		}
		return result;
	}
}