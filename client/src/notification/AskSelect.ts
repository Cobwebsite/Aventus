import { QuickPickOptions, window } from 'vscode';
import { ReceiveSelect } from '../cmds/ReceiveSelect';

export interface AskSelectOptions {
	placeHolder?: string,
	title?: string,
}

export interface SelectItem {
	label: string,
	detail: string,
	picked?: boolean,
}


export class AskSelect {
	public static cmd: string = "aventus/askselect";

	public static async action(uuid: string, items: SelectItem[], options: AskSelectOptions) {
		let optionsQuickPick: QuickPickOptions = options;
		optionsQuickPick.canPickMany = false;
		const temp = await window.showQuickPick(items, optionsQuickPick);
		let result: SelectItem | null = null;
		if (temp !== undefined) {
			result = temp;
		}
		ReceiveSelect.execute(uuid, result);
	}
}