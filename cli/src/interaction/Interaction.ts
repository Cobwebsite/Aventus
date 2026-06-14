import { Server } from '../server/Server';
import { RealInteraction } from './RealInteraction';

export type InteractionConfig = {
	clear: boolean,
	printLogo: boolean
}
export class Interaction {

	private static realInteraction?: typeof RealInteraction;

	public static async load(config?: InteractionConfig) {
		// this.realInteraction = (await import('./RealInteraction')).RealInteraction
		this.realInteraction = (await (eval('import("./RealInteraction.js")'))).default.RealInteraction
		// this.realInteraction = RealInteraction;
		this.realInteraction['_server'] = Server;
		if (config)
			this.realInteraction.config = config
	}
	public static async init() {
		this.clear();
		console.log("Welcome inside Aventus CLI");
	}
	public static clear() {
		this.realInteraction.clear()
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
	public static async password(question: string, validate?: (input: any) => boolean | string | Promise<boolean | string>) {
		return this.realInteraction?.password(question, validate) || null;
	}

	public static async tree(question: string, type: 'file' | 'directory' | 'file+directory', root?: string) {
		return this.realInteraction?.tree(question, type, root) || null;
	}

	public static async log() {
		return this.realInteraction?.log() || null;
	}
}