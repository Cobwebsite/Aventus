import { window } from 'vscode';
import { ReceiveInput } from '../cmds/ReceiveInput';
import { PopupResponse } from '../cmds/PopupResponse';


export class Popup {
	public static cmd: string = "aventus/popup";

	public static async action(uuid: string, text: string, choices: string[]) {
		const name = await window.showInformationMessage(text, ...choices);
		let result: string | null = null;
		if (name !== undefined) {
			result = name;
		}
		PopupResponse.execute(uuid, result);
	}
}