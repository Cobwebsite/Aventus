import { printLogo } from '../logo';
import { Server } from '../server/Server';
import { RealInteraction } from './RealInteraction';

export class Interaction {

	private static realInteraction?: typeof RealInteraction;

	public static async load() {
		this.realInteraction = (await (eval('import("./RealInteraction.js")'))).default.RealInteraction
		this.realInteraction['_server'] = Server;
	}
	public static async init() {
		this.clear();
		console.log("Welcome inside Aventus CLI");
	}
	public static clear() {
		console.clear();
		printLogo();
	}
	public static async select<T extends readonly { value: string, name: string, checked?: boolean }[]>(question: string, choices: T) {
		return this.realInteraction?.select(question, choices) || null;
	}

	public static async selectMultiple<T extends readonly { value: string, name: string, checked?: boolean }[]>(question: string, choices: T) {
		return this.realInteraction?.selectMultiple(question, choices) || null;
	}

	public static async input(question: string, defaultValue?: string, validate?: (input: any) => boolean | string | Promise<boolean | string>) {
		return this.realInteraction?.input(question, defaultValue, validate) || null;
	}

	public static async tree(question: string, root?: string) {
		return this.realInteraction?.tree(question, root) || null;
	}

	public static async log() {
		return this.realInteraction?.log() || null;
	}
}