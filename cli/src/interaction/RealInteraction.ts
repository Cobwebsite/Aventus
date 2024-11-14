import Checkbox from './action/Checkbox';
import FileTree from './action/FileTree';
import Input from './action/Input';
import Log, { LogConfig } from './action/Log';
import Select from './action/Select';
import { printLogo } from '../logo';

export class RealInteraction {

	public static clear() {
		console.clear();
		printLogo();
	}
	public static async select<T extends readonly { value: string, name: string, checked?: boolean }[]>(question: string, choices: T) {
		const response1 = await Select({
			message: question,
			choices: choices,
		})

		this.clear();
		return response1 as T[number]['value'] | null;
	}

	public static async selectMultiple<T extends readonly { value: string, name: string, checked?: boolean }[]>(question: string, choices: T) {
		let response1 = await Checkbox({
			message: question,
			choices: choices
		})
		this.clear();
		return response1 as T[number]['value'][] | null;
	}

	public static async input(question: string, defaultValue?: string, validate?: (input: any) => boolean | string | Promise<boolean | string>) {
		if (!validate) {
			validate = () => true;
		}
		if (!defaultValue) {
			defaultValue = "";
		}

		let response1 = await Input({
			message: question,
			default: defaultValue,
			validate: validate
		})
		this.clear();
		return response1;
	}

	public static async tree(question: string, root?: string) {
		let response = await FileTree({
			message: question,
			basePath: root,
			filter: (file) => {
				return file.isDirectory();
			}
		})

		this.clear();
		return response;
	}

	public static async log(config: LogConfig) {
		await Log(config);
	}
}