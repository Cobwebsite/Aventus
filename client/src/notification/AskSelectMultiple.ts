import { QuickPickOptions, window } from 'vscode';
import { ReceiveSelect } from '../cmds/ReceiveSelect';
import { AskSelectOptions, SelectItem } from './AskSelect';
import { ReceiveSelectMultiple } from '../cmds/ReceiveSelectMultiple';


export class AskSelectMultiple {
	public static cmd: string = "aventus/askselectmultiple";

	public static async action(uuid: string, items: SelectItem[], options: AskSelectOptions) {
		const temp = await window.showQuickPick(items, {
			...options,
			canPickMany: true,
		});
		let result: SelectItem[] | null = null;
		if (temp !== undefined) {
			result = temp;
		}
		ReceiveSelectMultiple.execute(uuid, result);
	}
}