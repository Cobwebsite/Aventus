import { window } from 'vscode';
import { ReceiveInput } from '../cmds/ReceiveInput';

export interface AskInputOptions {
	title: string,
	value?: string,
	validateInput?: (value: string) => Promise<string | null>,
}

export class AskInput {
	public static cmd: string = "aventus/askinput";

	public static async action(uuid: string, options: AskInputOptions) {
		const name = await window.showInputBox(options);
		let result: string | null = null;
		if (name !== undefined) {
			result = name;
		}
		ReceiveInput.execute(uuid, result);
	}
}