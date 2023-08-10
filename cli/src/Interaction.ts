import { PromptModule } from 'inquirer';

export class Interaction {
	private static _prompt: PromptModule;
	private static get prompt() {
		return this._prompt;
	}
	public static async init() {
		const { createPromptModule } = await (eval('import("inquirer")') as Promise<typeof import('inquirer')>);
		this._prompt = createPromptModule();
	}
	public static async select<T extends readonly { value: string, name: string }[]>(question: string, choices: T) {
		let choicesToSend = [];
		let response = await this.prompt([{
			name: "temp",
			type: "list",
			message: question,
			choices: choices
		}])
		return response["temp"] as T[number]['value'];
	}
}