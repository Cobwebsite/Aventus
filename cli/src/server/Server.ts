import { Interaction } from '../interaction/Interaction';
import type { RealServer } from './RealServer';

export class Server {

	private static realServer?: typeof RealServer;
	public static async load() {
		this.realServer = (await (eval('import("./RealServer.js")'))).default.RealServer
		this.realServer['_interaction'] = Interaction
	}

	public static subscribeErrors(cb: (errors: string[]) => void) {
		return this.realServer?.subscribeErrors(cb);
	}
	public static unsubscribeErrors(cb: (errors: string[]) => void) {
		return this.realServer?.unsubscribeErrors(cb);
	}
	public static getErrors() {
		return this.realServer?.getErrors();
	}
	public static start() {
		console.log("Initing...");
		return this.realServer?.start();
	}
	public static create() {
		return this.realServer?.create();
	}
}