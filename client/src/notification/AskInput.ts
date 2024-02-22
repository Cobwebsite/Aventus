import { window } from 'vscode';
import { ReceiveInput } from '../cmds/ReceiveInput';

export interface AskInputOptions {
	title: string,
	value?: string,
	validations?: { regex: string, message: string }[]
}

export class AskInput {
	public static cmd: string = "aventus/askinput";

	public static async action(uuid: string, options: AskInputOptions) {

		let validations: ((value: string) => string | null)[] = [];
		if(options.validations) {
			const addValidation = (val:{ regex: string, message: string }) => {
				validations.push((value: string) => {
					if (!value.match(new RegExp(val.regex))) {
						return val.message;
					}
					return null;
				})
			}
			for (let validation of options.validations) {
				addValidation(validation);
			}
		}

		const name = await window.showInputBox({
			title:options.title,
			value: options.value,
			validateInput: async (value: string) => {
				for (let validation of validations) {
					let tempResult = validation(value);
					if (tempResult !== null) {
						return tempResult;
					}
				}
				return null;
			}
		});
		let result: string | null = null;
		if (name !== undefined) {
			result = name;
		}
		ReceiveInput.execute(uuid, result);
	}
}