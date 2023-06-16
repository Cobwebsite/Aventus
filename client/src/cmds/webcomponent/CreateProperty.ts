import { window } from 'vscode';
import { BuildQuickPick, QuickPick } from '../../quickPick';

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
				const name = await window.showInputBox({
					title: "Provide a name for your Property",
					async validateInput(value) {
						if (!value.match(/^[_a-z0-9]+$/g)) {
							return 'A property must be with lowercase, number or _';
						}
						return null;
					},
					value: prefillName
				});
				if (name) {
					result.push(name);
					const type = await window.showQuickPick(QuickPick.attrType, {
						placeHolder: 'Choose a type?',
						canPickMany: false,
					});
					if (type !== undefined && type.detail !== undefined) {
						QuickPick.reorder(QuickPick.attrType, type);
						result.push(type.detail);

						let toDisplay: BuildQuickPick[] = [];
						toDisplay.push(new BuildQuickPick("Yes", ""));
						toDisplay.push(new BuildQuickPick("No", ""));
						const yesOrNo = await window.showQuickPick(toDisplay, {
							placeHolder: 'Do you need a callback function?',
							canPickMany: false,
						});
						if (yesOrNo !== undefined) {
							result.push(yesOrNo.label == "Yes");
						}

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