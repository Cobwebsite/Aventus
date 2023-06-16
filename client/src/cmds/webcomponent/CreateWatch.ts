import { window } from 'vscode';
import { BuildQuickPick } from '../../quickPick';

export class CreateWatch {
	static cmd: string = "aventus.wc.create.watch";

	public static async middleware(args: any[]): Promise<any[]> {
		let result: (string | number | boolean)[] = [];
		if (window.activeTextEditor) {
			let uri = "";
			if (args.length > 0) {
				if (args[0].toString().startsWith("prefill:")) {
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
			result.push(uri);

			const name = await window.showInputBox({
				title: "Provide a name to watch",
			});
			if (name) {
				result.push(name);
				const type = await window.showInputBox({
					title: "Provide a type for your Watch",
				});
				if (type) {
					result.push(type);
					let toDisplay: BuildQuickPick[] = [];
					toDisplay.push(new BuildQuickPick("Yes", ""));
					toDisplay.push(new BuildQuickPick("No", ""));
					const yesOrNo = await window.showQuickPick(toDisplay, {
						placeHolder: 'Do you need a callback function?',
						canPickMany: false,
					});
					if (yesOrNo !== undefined) {
						result.push(yesOrNo.label == "Yes");

						let activeEditor = window.activeTextEditor;
						let document = activeEditor.document;
						let curPos = activeEditor.selection.active;
						result.push(document.offsetAt(curPos));
					}
				}

			}
		}
		return result;
	}
}