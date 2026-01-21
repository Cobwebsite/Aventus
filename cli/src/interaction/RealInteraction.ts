import Checkbox from './action/Checkbox';
import FileTree from './action/FileTree';
import Input from './action/Input';
import Log, { LogConfig } from './action/Log';
import Select from './action/Select';
import { printLogo } from '../logo';
import type { Server } from '../server/Server';
import { CliErrorsBuild } from '../server/Connection';
import Password from './action/Password';
import type { FileStats } from './action/FileTreeDef';

export type InteractionConfig = {
	clear: boolean,
	printLogo: boolean
}
export class RealInteraction {
	private static _server: typeof Server;
	public static get server(): typeof Server {
		return this._server;
	}
	public static config: InteractionConfig = {
		clear: false,
		printLogo: false
	};

	public static clear() {
		if (this.config.clear)
			console.clear();
		if (this.config.printLogo)
			printLogo();
	}
	public static async select<T extends readonly { value: string, name: string, checked?: boolean }[]>(question: string, choices: T) {
		if(choices.length == 0) {
			console.error("No choice available");
			return null;
		}
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
			validate: validate,
		})
		this.clear();
		return response1;
	}

	public static async password(question: string, validate?: (input: any) => boolean | string | Promise<boolean | string>) {
		if (!validate) {
			validate = () => true;
		}

		let response1 = await Password({
			message: question,
			validate: validate,
		})
		this.clear();
		return response1;
	}

	public static async tree(question: string, type: 'file' | 'directory' | 'file+directory', root?: string) {
		let filter: undefined | ((file: FileStats) => boolean) = undefined
		if (type == "directory") {
			filter = (file) => {
				return file.isDirectory();
			}
		}
		let response = await FileTree({
			message: question,
			basePath: root,
			type: type,
			filter
		})

		this.clear();
		return response;
	}

	public static async log() {
		await Log({
			errors: this.server.getErrors(),
			refresh: (cb: (errors: CliErrorsBuild, build: string) => void) => {
				this.server.subscribeErrors(cb);
			},
			stopRefresh: (cb: (errors: CliErrorsBuild, build: string) => void) => {
				this.server.unsubscribeErrors(cb);
			}
		});
	}
}