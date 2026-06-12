import { LogLevel } from '@server/settings/LogLevel';
import { Interaction } from '../interaction/Interaction';
import { CliErrorsBuild } from './Connection';
import type { RealServer } from './RealServer';
import type { InputOptions } from '@server/IConnection';

export type ServerConfig = {
	noBuild?: boolean,
	noStart?: boolean,
	watchFiles?: boolean,
	useCompilators?: boolean,
	useTemplates?: boolean,
	buildOnly?: boolean,
	loadFiles?: boolean,
	configPath?: string,
	builds?: string[],
	statics?: string[],
	logLevel?: LogLevel,
	errorByBuild?: boolean,
	useStats?: boolean
}

export class Server {

	private static realServer?: typeof RealServer;
	public static async load() {
		this.realServer = (await (eval('import("./RealServer.js")'))).default.RealServer
		this.realServer['_interaction'] = Interaction
	}

	public static subscribeErrors(cb: (errors: CliErrorsBuild, build: string) => void) {
		return this.realServer?.subscribeErrors(cb);
	}
	public static unsubscribeErrors(cb: (errors: CliErrorsBuild, build: string) => void) {
		return this.realServer?.unsubscribeErrors(cb);
	}
	public static executeCommand(cmd: string, ...args: any[]) {
		return this.realServer?.executeCommand(cmd, ...args);
	}
	public static getErrors() {
		return this.realServer?.getErrors();
	}
	public static start(config: ServerConfig) {
		return this.realServer?.start(config);
	}
	public static create() {
		return this.realServer?.create();
	}

	public static getStatistics() {
		return this.realServer?.getStatistics();
	}

	public static async Input(options: InputOptions): Promise<string | null> {
		return this.realServer?.Input(options);
	}
}