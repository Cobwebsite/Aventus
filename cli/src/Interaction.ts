import { PromptModule, createPromptModule } from 'inquirer';
import { printLogo } from './logo';
import { Actions } from './lib/index.js';
import * as inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
export class Interaction {
	private static _prompt: PromptModule;
	private static get prompt() {
		return this._prompt;
	}
	public static async init() {
		// const { createPromptModule } = await (eval('import("inquirer")') as Promise<typeof import('inquirer')>);
		// const inquirerFileTreeSelection = await (eval('import("inquirer-file-tree-selection-prompt")') as Promise<typeof import('inquirer-file-tree-selection-prompt')>);
		// const { Actions } = await (eval('import("./lib/index.js")') as Promise<typeof import('./lib/index')>);
		this._prompt = createPromptModule();
		this._prompt.registerPrompt('file-tree-selection', inquirerFileTreeSelection.default)
		this._prompt.registerPrompt('av-select', await Actions.Select() as any)
		this._prompt.registerPrompt('av-checkbox', await Actions.Checkbox() as any)
		this._prompt.registerPrompt('av-input', await Actions.Input() as any)
		this._prompt.registerPrompt('av-file-tree', await Actions.FileTree() as any)
		this._prompt.registerPrompt('av-log', await Actions.Log() as any)
		this.clear();
	}
	public static clear() {
		console.clear();
		printLogo();
	}
	public static async select<T extends readonly { value: string, name: string, checked?: boolean }[]>(question: string, choices: T) {
		let response1 = await this.prompt([{
			name: "temp",
			type: "av-select",
			message: question,
			choices: choices
		}])
		this.clear();
		return response1['temp'] as T[number]['value'];

		// let response = await Select({
		// 	message: question,
		// 	choices: choices
		// })
		// this.clear();
		// if (!response) {
		// 	return null;
		// }
		// return response as T[number]['value'];
	}

	public static async selectMultiple<T extends readonly { value: string, name: string, checked?: boolean }[]>(question: string, choices: T) {
		let response1 = await this.prompt([{
			name: "temp",
			type: "av-checkbox",
			message: question,
			choices: choices
		}])
		this.clear();
		return response1['temp'] as T[number]['value'][];


		return null;
		// let response = await Checkbox({
		// 	message: question,
		// 	choices: choices
		// })

		// this.clear();
		// if (!response) {
		// 	return null;
		// }
		// return response as T[number]['value'][];
	}

	public static async input(question: string, defaultValue?: string, validate?: (input: any) => boolean | string | Promise<boolean | string>) {
		if (!validate) {
			validate = () => true;
		}
		if (!defaultValue) {
			defaultValue = "";
		}

		let response1 = await this.prompt([{
			name: "temp",
			type: "av-input",
			message: question,
			default: defaultValue,
			validate: validate
		}])
		this.clear();
		return response1['temp'] as string | null;
	}

	public static async tree(question: string, root?: string) {
		let response = await this.prompt([{
			name: "temp",
			type: "av-file-tree",
			message: question,
			root: root,
			onlyShowDir: true
		}])
		this.clear();
		return response["temp"] as string | null;
	}

	public static async log() {
		let response1 = await this.prompt([{
			name: "temp",
			type: 'av-log'
		}]);
	}
}