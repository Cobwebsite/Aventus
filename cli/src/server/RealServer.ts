import { GenericServer } from '@server/GenericServer';
import { Create } from '@server/cmds/Create';
import { CliConnection, CliErrors, CliErrorsBuild, FakeConnection } from './Connection';
import { pathToUri } from '@server/tools';
import { FilesWatcher } from '../file-system/FileSystem'
import { ServerConfig } from './Server';
import { Statistics } from './notification/Statistics';
import type { Interaction } from '../interaction/Interaction';
import type { StatisticsInfo } from '@server/notification/Statistics';
import type { InputOptions } from '@server/IConnection';

export class RealServer {
	private static _interaction: typeof Interaction;
	public static get interaction(): typeof Interaction {
		return this._interaction;
	}
	private static server: GenericServer | null = null;
	private static cliConnection: CliConnection | null = null;
	private static get connection(): FakeConnection | null {
		return this.cliConnection ? this.cliConnection._connection : null;
	}

	public static get notifications() {
		return this.cliConnection?.notifications;
	}

	private static waitingStart: (() => void) | null = null;
	public static start(config: ServerConfig) {
		return new Promise<void>((resolve) => {
			try {
				if (!this.server) {
					this.cliConnection = new CliConnection(config);
					if (config.watchFiles)
						new FilesWatcher(process.cwd())
					this.server = new GenericServer(this.cliConnection);
					if (config.noStart) {
						resolve();
					}
					else {
						this.waitingStart = () => {
							this.waitingStart = null;
							resolve();
						}
						this.server.start();
					}

				}
			} catch (e) {
				console.log(e);
			}
		})
	}
	public static started() {
		if (this.waitingStart) {
			this.waitingStart();
		}
	}

	public static async create() {
		await Create.run(pathToUri(process.cwd()));
	}

	public static stop() {
		if (this.connection) {
			this.connection.stop();
		}
	}

	public static async log() {
		await this.interaction.log();
	}

	public static subscribeErrors(cb: (errors: CliErrorsBuild, build: string) => void) {
		this.cliConnection?.subscribeErrors(cb);
	}
	public static unsubscribeErrors(cb: (errors: CliErrorsBuild, build: string) => void) {
		this.cliConnection?.unsubscribeErrors(cb);
	}
	public static async executeCommand(cmd: string, ...args: any[]) {
		await this.cliConnection.executeCommand({
			command: cmd,
			arguments: args,
		})
	}

	public static getErrors(): CliErrors {
		return this.cliConnection?.errorsByBuildByFile ?? {};
	}

	public static getStatistics(): StatisticsInfo {
		return Statistics.info;
	}


	static async Input(options: InputOptions): Promise<string | null> {
		return this.cliConnection.Input(options);
	}

}