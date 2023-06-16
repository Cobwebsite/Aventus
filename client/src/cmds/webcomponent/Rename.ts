import { window } from 'vscode';

export class Rename {
	static cmd: string = "aventus.component.rename";

	public static async middleware(args: any[]): Promise<any[] | null> {
		let result: (string | number)[] = [];

		if (!args || args.length == 0) {
			return null;
		}
		let uri = args[0].toString().replace(/\.wcv\.avt$/, ".wcl.avt").replace(/\.wcs\.avt$/, ".wcl.avt")
		result.push(uri);
		let splitted = uri.split("/");
		let oldName = splitted[splitted.length - 1].replace(".wcl.avt", "");
		const name = await window.showInputBox({
			title: "New name",
			value: oldName,
			async validateInput(value) {
				if (!value.match(/^[_A-Za-z0-9\-]+$/g)) {
					return 'Your name isn\'t valid';
				}
				return null;
			},
		});
		if (name !== undefined) {
			result.push(name);
			return result;
		}
		return null;
	}
}